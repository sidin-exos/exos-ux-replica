import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Upload, Loader2, FileText, X } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useToast } from "@/hooks/use-toast";

export default function NewProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createProject } = useProjects();
  const { files, uploadFile } = useUserFiles({ paginate: false });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    list.forEach((file) => {
      uploadFile.mutate(file, {
        onSuccess: (row) => {
          setSelectedFileIds((prev) => [...prev, row.id]);
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

  const toggleFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Project name is required", variant: "destructive" });
      return;
    }
    try {
      await createProject.mutateAsync({
        name,
        description,
        fileIds: selectedFileIds,
      });
      toast({ title: "Project created" });
      navigate("/projects");
    } catch (err: any) {
      toast({
        title: "Failed to create project",
        description: err?.message ?? "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-iris flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Create a project</h1>
            <p className="text-sm text-muted-foreground">
              Upload info about your project and relevant files and use for multiple scenarios.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>Add files now or attach them later.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 Packaging Sourcing"
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
                  placeholder="What is this project about? Goals, scope, key suppliers, constraints…"
                  rows={12}
                  maxLength={2000}
                  className="min-h-[260px]"
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
                        Upload files
                      </span>
                    </Button>
                  </label>
                </div>

                {selectedFileIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFileIds.map((id) => {
                      const file = files.find((f) => f.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          <FileText className="w-3 h-3" />
                          <span className="max-w-[180px] truncate">
                            {file?.file_name ?? "Uploading…"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleFile(id)}
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
                    <ScrollArea className="h-40 rounded-md border border-border p-2">
                      <div className="space-y-1">
                        {files.map((file) => {
                          const checked = selectedFileIds.includes(file.id);
                          return (
                            <button
                              type="button"
                              key={file.id}
                              onClick={() => toggleFile(file.id)}
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

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProject.isPending || !name.trim()}>
                  {createProject.isPending && (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  )}
                  Create project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
