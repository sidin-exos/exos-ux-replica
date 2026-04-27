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

  return { projects, isLoading, createProject, deleteProject };
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
