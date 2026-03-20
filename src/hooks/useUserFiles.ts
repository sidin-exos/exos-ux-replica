import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { isAuthError, showAuthErrorToast } from "@/lib/auth-utils";
import {
  validateFile,
  validateMagicBytes,
  sanitizeFilename,
  ALLOWED_MIME_TYPES,
  type AllowedExtension,
} from "@/lib/file-validation";

export type UserFile = Database["public"]["Tables"]["user_files"]["Row"];

export interface UseUserFilesOptions {
  search?: string;
  fileType?: AllowedExtension | null;
  page?: number;
  pageSize?: number;
  paginate?: boolean;
}

const QUERY_KEY = ["user_files"];
const DEFAULT_PAGE_SIZE = 10;

export function useUserFiles(options: UseUserFilesOptions = {}) {
  const {
    search = "",
    fileType = null,
    page = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    paginate = false,
  } = options;

  const { user } = useUser();
  const queryClient = useQueryClient();
  // Fetch user's files
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, { search, fileType, page, pageSize, paginate }],
    queryFn: async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      let query = supabase
        .from("user_files")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("file_name", `%${search}%`);
      }

      if (fileType) {
        query = query.eq("file_type", fileType);
      }

      if (paginate) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      } else {
        query = query.limit(50);
      }

      const { data: rows, error, count } = await query;

      if (error) throw error;
      return {
        files: rows ?? [],
        totalCount: count ?? 0,
      };
    },
    enabled: !!user,
    placeholderData: keepPreviousData,
  });

  const files = data?.files ?? [];
  const totalCount = data?.totalCount ?? 0;

  // Upload file mutation
  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      // Client-side validation
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // Get user's org_id for storage path
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", currentUser.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error("Organization not found. Please contact support.");
      }

      if (!validation.extension) {
        throw new Error("Could not determine file extension");
      }
      const ext = validation.extension;

      // Magic bytes validation — verify file content matches claimed extension
      const magicCheck = await validateMagicBytes(file, ext);
      if (!magicCheck.valid) {
        throw new Error(magicCheck.error);
      }

      const sanitized = sanitizeFilename(file.name);
      const fileUuid = crypto.randomUUID();
      const storagePath = `${profile.organization_id}/${currentUser.id}/${fileUuid}-${sanitized}`;

      // Path traversal prevention — validate constructed path
      const pathParts = storagePath.split("/");
      if (
        pathParts.length !== 3 ||
        pathParts[0] !== profile.organization_id ||
        pathParts[1] !== currentUser.id ||
        storagePath.includes("..") ||
        storagePath.includes("//") ||
        storagePath.includes("\x00")
      ) {
        throw new Error("Invalid storage path");
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(storagePath, file, {
          contentType: ALLOWED_MIME_TYPES[ext],
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Insert metadata row
      const row: Database["public"]["Tables"]["user_files"]["Insert"] = {
        user_id: currentUser.id,
        organization_id: profile.organization_id,
        file_name: file.name,
        file_type: ext,
        mime_type: ALLOWED_MIME_TYPES[ext],
        file_size: file.size,
        storage_path: storagePath,
      };

      const { data, error } = await supabase
        .from("user_files")
        .insert(row)
        .select()
        .single();

      if (error) {
        // Cleanup: remove uploaded file if metadata insert fails
        await supabase.storage.from("user-files").remove([storagePath]);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("File uploaded", { description: "Your file has been uploaded successfully." });
    },
    onError: (err: Error) => {
      if (isAuthError(err)) {
        showAuthErrorToast();
        return;
      }
      toast.error("Upload failed", { description: err.message });
    },
  });

  // Delete file mutation
  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // Get file's storage path
      const { data: file, error: lookupError } = await supabase
        .from("user_files")
        .select("storage_path")
        .eq("id", fileId)
        .single();

      if (lookupError || !file) throw new Error("File not found");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete metadata row (cascade deletes scenario_file_attachments)
      const { error: deleteError } = await supabase
        .from("user_files")
        .delete()
        .eq("id", fileId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("File deleted", { description: "The file has been removed." });
    },
    onError: (err: Error) => {
      if (isAuthError(err)) {
        showAuthErrorToast();
        return;
      }
      toast.error("Delete failed", { description: err.message });
    },
  });

  // Get signed download URL via Edge Function (audit-logged, rate-limited).
  // Uses direct fetch because supabase.functions.invoke doesn't send the
  // Authorization header reliably — confirmed via Supabase Invocations tab.
  const getDownloadUrl = async (fileId: string): Promise<string> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    // supabaseUrl and supabaseKey are public runtime properties on the client
    const { supabaseUrl, supabaseKey } = supabase as any;

    const res = await fetch(`${supabaseUrl}/functions/v1/file-download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify({ file_id: fileId }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || `Download failed (${res.status})`);
    }

    if (!data?.signedUrl) throw new Error("Failed to get download URL");

    return data.signedUrl;
  };

  // Get signed URL for inline preview (no Content-Disposition: attachment).
  // Uses storage directly — no Edge Function because preview is read-only
  // and storage RLS already enforces org-scoped access.
  const getPreviewUrl = async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("user-files")
      .createSignedUrl(storagePath, 60);

    if (error || !data?.signedUrl) {
      throw new Error("Failed to generate preview URL");
    }

    return data.signedUrl;
  };

  return {
    files,
    totalCount,
    pageSize,
    isLoading,
    uploadFile,
    deleteFile,
    getDownloadUrl,
    getPreviewUrl,
  };
}
