import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Folder,
  Upload,
  Loader2,
  FileText,
  X,
  Trash2,
  Save,
} from "lucide-react";
import {
  useProject,
  useProjects,
  useProjectFiles,
  useProjectFileMutations,
} from "@/hooks/useProjects";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: project, isLoading } = useProject(projectId);
  const { updateProject, deleteProject } = useProjects();
  const { data: projectFiles = [] } = useProjectFiles(projectId);
  const { attachFiles, detachFile } = useProjectFileMutations(projectId);
  const { files: libraryFiles, uploadFile } = useUserFiles({ paginate: false });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name ?? "");
      setDescription(project.description ?? "");
    }
  }, [project]);

  const attachedFileIds = new Set(projectFiles.map((row: any) => row.file_id));
  const availableFiles = libraryFiles.filter((f) => !attachedFileIds.has(f.id));

  const isDirty =
    project &&
    (name.trim() !== (project.name ?? "") ||
      (description.trim() || "") !== (project.description ?? ""));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !name.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }
    await updateProject.mutateAsync({ id: projectId, name, description });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    list.forEach((file) => {
      uploadFile.mutate(file, {
        onSuccess: (row) => {
          attachFiles.mutate([row.id]);
        },
        onError: (err: any) => {
          toast({
            title: "Upload failed",
            description: err?.message ?? "Could not upload file",
            variant: "destructive",
          });
        },
      });
    });
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!projectId) return;
    await deleteProject.mutateAsync(projectId);
    navigate("/projects");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-sm text-muted-foreground">Loading project…</p>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-2xl">
          <button
            onClick={() => navigate("/projects")}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                This project doesn't exist or you don't have access to it.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-3xl space-y-6">
        <button
          onClick={() => navigate("/projects")}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-iris flex items-center justify-center">
              <Folder className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <p className="text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                {project.updated_at &&
                  project.updated_at !== project.created_at &&
                  ` · Updated ${formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}`}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete project
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the project and unlink its files. The original
                  files in your library will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>Edit the name and description.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="What is this project about? Goals, scope, key suppliers, constraints…"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || updateProject.isPending || !name.trim()}
                >
                  {updateProject.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Files</CardTitle>
                <CardDescription>
                  {projectFiles.length} attached
                </CardDescription>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={uploadFile.isPending}
                >
                  <span className="flex items-center gap-1.5">
                    {uploadFile.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload files
                  </span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No files attached yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {projectFiles.map((row: any) => (
                  <Badge key={row.id} variant="secondary" className="gap-1 pr-1">
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[220px] truncate">
                      {row.user_files?.file_name ?? "File"}
                    </span>
                    <button
                      type="button"
                      onClick={() => detachFile.mutate(row.id)}
                      className="ml-1 hover:text-destructive"
                      aria-label="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {availableFiles.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Attach from your existing files
                </p>
                <ScrollArea className="h-40 rounded-md border border-border p-2">
                  <div className="space-y-1">
                    {availableFiles.map((file) => (
                      <button
                        type="button"
                        key={file.id}
                        onClick={() => attachFiles.mutate([file.id])}
                        disabled={attachFiles.isPending}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors hover:bg-muted/50"
                      >
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate flex-1">{file.file_name}</span>
                        <span className="text-[10px] text-muted-foreground">Attach</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
