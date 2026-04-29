import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { FolderPlus, Folder, Trash2, FileText, Inbox } from "lucide-react";
import { useProjects, useProjectFiles } from "@/hooks/useProjects";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { formatDistanceToNow } from "date-fns";

function ProjectFilesPreview({ projectId }: { projectId: string }) {
  const { data = [] } = useProjectFiles(projectId);
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No files attached.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.slice(0, 6).map((row: any) => (
        <Badge key={row.id} variant="secondary" className="gap-1">
          <FileText className="w-3 h-3" />
          <span className="max-w-[160px] truncate">
            {row.user_files?.file_name ?? "File"}
          </span>
        </Badge>
      ))}
      {data.length > 6 && (
        <Badge variant="outline">+{data.length - 6}</Badge>
      )}
    </div>
  );
}

export default function Projects() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { projects, isLoading, deleteProject } = useProjects();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Bundle reusable context and files. Use a project across multiple
              scenarios so you don't have to upload or re-explain anything.
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Create a project
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading projects…</p>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground/40 mb-4" />
              <h2 className="text-lg font-semibold mb-1">No projects yet</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Create your first project to attach files and context that can
                be reused across scenarios.
              </p>
              <Button onClick={() => setOpen(true)}>
                <FolderPlus className="w-4 h-4 mr-1.5" />
                Create a project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="border-t-4 border-t-primary cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Folder className="w-4 h-4 text-primary" />
                      {project.name}
                    </CardTitle>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          aria-label="Delete project"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the project and unlink its files.
                            The original files in your library will not be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteProject.mutate(project.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ProjectFilesPreview projectId={project.id} />
                  <p className="text-[11px] text-muted-foreground">
                    Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <CreateProjectDialog open={open} onOpenChange={setOpen} redirectTo={null} />
    </div>
  );
}
