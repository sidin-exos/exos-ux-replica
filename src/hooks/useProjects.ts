import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/useUser";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectFile = Database["public"]["Tables"]["project_files"]["Row"];

const PROJECTS_KEY = ["projects"];
const PROJECT_FILES_KEY = (projectId?: string) =>
  projectId ? ["project_files", projectId] : ["project_files"];

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  fileIds?: string[];
}

export function useProjects() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const createProject = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", currentUser.id)
        .single();
      if (!profile?.organization_id) {
        throw new Error("Organization not found.");
      }

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id: currentUser.id,
          organization_id: profile.organization_id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          color: input.color ?? null,
          icon: input.icon ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.fileIds?.length) {
        const rows = input.fileIds.map((fileId) => ({
          project_id: project.id,
          file_id: fileId,
          user_id: currentUser.id,
          organization_id: profile.organization_id!,
        }));
        const { error: linkErr } = await supabase
          .from("project_files")
          .insert(rows);
        if (linkErr) throw linkErr;
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      toast({ title: "Project created", description: "Your project is ready to use." });
    },
    onError: (err: Error) => {
      toast({ title: "Could not create project", description: err.message, variant: "destructive" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["project_files"] });
      toast({ title: "Project deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (input: { id: string; name?: string; description?: string | null; color?: string | null; icon?: string | null }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("projects")
        .update({
          ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
          ...(patch.description !== undefined ? { description: patch.description?.trim() || null } : {}),
          ...(patch.color !== undefined ? { color: patch.color } : {}),
          ...(patch.icon !== undefined ? { icon: patch.icon } : {}),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["project", project.id] });
      toast({ title: "Project updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  return { projects, isLoading, createProject, deleteProject, updateProject };
}

export function useProject(projectId?: string) {
  const { user } = useUser();
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!projectId,
  });
}

export function useProjectFileMutations(projectId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const attachFiles = useMutation({
    mutationFn: async (fileIds: string[]) => {
      if (!projectId || fileIds.length === 0) return;
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", currentUser.id)
        .single();
      if (!profile?.organization_id) throw new Error("Organization not found.");

      const rows = fileIds.map((fileId) => ({
        project_id: projectId,
        file_id: fileId,
        user_id: currentUser.id,
        organization_id: profile.organization_id!,
      }));
      const { error } = await supabase.from("project_files").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_FILES_KEY(projectId) });
    },
    onError: (err: Error) => {
      toast({ title: "Could not attach file", description: err.message, variant: "destructive" });
    },
  });

  const detachFile = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("project_files").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_FILES_KEY(projectId) });
    },
    onError: (err: Error) => {
      toast({ title: "Could not remove file", description: err.message, variant: "destructive" });
    },
  });

  return { attachFiles, detachFile };
}

export function useProjectFiles(projectId?: string) {
  return useQuery({
    queryKey: PROJECT_FILES_KEY(projectId),
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_files")
        .select("*, user_files(*)")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });
}
