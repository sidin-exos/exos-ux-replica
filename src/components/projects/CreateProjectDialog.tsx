import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Upload, X, FileText, FolderPlus } from "lucide-react";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useProjects } from "@/hooks/useProjects";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to navigate after success. Defaults to /projects. */
  redirectTo?: string | null;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  redirectTo = "/projects",
}: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const { files, uploadFile } = useUserFiles({ paginate: false });
  const { createProject } = useProjects();

  const reset = () => {
    setName("");
    setDescription("");
    setSelectedFileIds([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    list.forEach((file) => {
      uploadFile.mutate(file, {
        onSuccess: (row) => {
          setSelectedFileIds((prev) => [...prev, row.id]);
        },
      });
    });
    e.target.value = "";
  };

  const toggleExistingFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const project = await createProject.mutateAsync({
      name,
      description,
      fileIds: selectedFileIds,
    });
    reset();
    onOpenChange(false);
    if (redirectTo) navigate(redirectTo);
    return project;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-primary" />
            Create a project
          </DialogTitle>
          <DialogDescription>
            Bundle context and files you can reuse across multiple scenarios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              placeholder="e.g. LPDDR Sourcing 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description (optional)</Label>
            <Textarea
              id="project-description"
              placeholder="What is this project about? Include suppliers, geography, timeframe…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Project files</Label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
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
                    Upload
                  </span>
                </Button>
              </label>
            </div>

            {selectedFileIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedFileIds.map((id) => {
                  const file = files.find((f) => f.id === id);
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      <FileText className="w-3 h-3" />
                      <span className="max-w-[160px] truncate">
                        {file?.file_name ?? "Uploading…"}
                      </span>
                      <button
                        onClick={() => toggleExistingFile(id)}
                        className="ml-1 hover:text-destructive"
                        aria-label="Remove file"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Or pick from your existing files
                </p>
                <ScrollArea className="h-32 rounded-md border border-border p-2">
                  <div className="space-y-1">
                    {files.map((file) => {
                      const checked = selectedFileIds.includes(file.id);
                      return (
                        <button
                          type="button"
                          key={file.id}
                          onClick={() => toggleExistingFile(file.id)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                            checked
                              ? "bg-primary/10 text-foreground"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="pointer-events-none"
                          />
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate flex-1">{file.file_name}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createProject.isPending}
          >
            {createProject.isPending && (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            )}
            Create project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
