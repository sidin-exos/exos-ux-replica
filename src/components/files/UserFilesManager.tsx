import { useState, useEffect } from "react";
import { Download, Trash2, FolderOpen, Loader2, FileSpreadsheet, FileText, File, SearchX, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FileUploadZone from "@/components/enterprise/FileUploadZone";
import FileSearchFilterBar from "@/components/files/FileSearchFilterBar";
import FilePagination from "@/components/files/FilePagination";
import { useUserFiles, type UserFile } from "@/hooks/useUserFiles";
import { useDebounce } from "@/hooks/useDebounce";
import { validateFile } from "@/lib/file-validation";
import { formatFileSize, getFileTypeLabel, type AllowedExtension } from "@/lib/file-validation";
import { toast } from "sonner";

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  xlsx: FileSpreadsheet,
  docx: FileText,
  pdf: File,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  xlsx: "text-green-500",
  docx: "text-blue-500",
  pdf: "text-red-500",
};

const UserFilesManager = () => {
  const [searchInput, setSearchInput] = useState("");
  const [fileType, setFileType] = useState<AllowedExtension | null>(null);
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { files, totalCount, pageSize, isLoading, uploadFile, deleteFile, getDownloadUrl, getPreviewUrl } =
    useUserFiles({ search: debouncedSearch, fileType, page, pageSize: 10, paginate: true });

  const [pendingFiles, setPendingFiles] = useState<globalThis.File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserFile | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const hasActiveFilters = debouncedSearch !== "" || fileType !== null;

  // Reset page and selection when filters change
  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [debouncedSearch, fileType]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return;
    setIsUploading(true);

    const failed: globalThis.File[] = [];

    for (const file of pendingFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        failed.push(file);
        continue;
      }

      try {
        await uploadFile.mutateAsync(file);
      } catch {
        failed.push(file);
      }
    }

    setPendingFiles(failed);

    setIsUploading(false);
  };

  const handleDownload = async (file: UserFile) => {
    setDownloadingId(file.id);
    try {
      const url = await getDownloadUrl(file.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (file: UserFile) => {
    try {
      const url = await getPreviewUrl(file.storage_path);
      setPreviewUrl(url);
      setPreviewFile(file);
    } catch (err) {
      toast.error("Preview failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFile.mutateAsync(deleteTarget.id);
    } catch {
      // Error handled by mutation onError
    }
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        await deleteFile.mutateAsync(id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setSelectedIds(new Set());
    setShowBulkDeleteDialog(false);
    setIsBulkDeleting(false);

    if (failCount > 0) {
      toast.error(`Deleted ${successCount} files, ${failCount} failed`);
    }
  };

  return (
    <>
      <Card className="card-elevated animate-fade-up" style={{ animationDelay: "150ms" }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <CardTitle className="font-display text-lg">My Files</CardTitle>
          </div>
          <CardDescription>
            Upload and manage documents for scenario analysis. Supported: Excel, Word, PDF (max 10MB).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload zone */}
          <div className="space-y-3">
            <FileUploadZone
              files={pendingFiles}
              onFilesChange={setPendingFiles}
              accept=".xlsx,.docx,.pdf"
              maxSizeMB={10}
              description="Excel (.xlsx), Word (.docx), PDF (.pdf) — max 10MB per file"
            />
            {pendingFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`
                )}
              </Button>
            )}
          </div>

          {/* Search and filter */}
          <FileSearchFilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            fileType={fileType}
            onFileTypeChange={setFileType}
          />

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2">
              <span className="text-sm font-medium">
                {selectedIds.size} file{selectedIds.size > 1 ? "s" : ""} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete selected
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </Button>
            </div>
          )}

          {/* File list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 && !hasActiveFilters ? (
            <div className="text-center py-8 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">
                Upload documents to attach them to your scenario analyses
              </p>
            </div>
          ) : files.length === 0 && hasActiveFilters ? (
            <div className="text-center py-8 text-muted-foreground">
              <SearchX className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No files match your search</p>
              <p className="text-sm mb-3">Try a different search term or filter</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setFileType(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={files.length > 0 && selectedIds.size === files.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all files"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Size</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => {
                    const Icon = FILE_TYPE_ICONS[file.file_type] || File;
                    const colorClass = FILE_TYPE_COLORS[file.file_type] || "text-muted-foreground";
                    const isSelected = selectedIds.has(file.id);

                    return (
                      <TableRow key={file.id} data-state={isSelected ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(file.id)}
                            aria-label={`Select ${file.file_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`w-4 h-4 shrink-0 ${colorClass}`} />
                            <span className="truncate text-sm font-medium">
                              {file.file_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">
                            {getFileTypeLabel(file.file_type as AllowedExtension)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {file.file_type === "pdf" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handlePreview(file)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(file)}
                              disabled={downloadingId === file.id}
                            >
                              {downloadingId === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(file)}
                              disabled={deleteFile.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <FilePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(p) => {
              setPage(p);
              setSelectedIds(new Set());
            }}
          />
        </CardContent>
      </Card>

      {/* Single delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.file_name}</strong> and
              remove it from any attached scenarios. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={(v) => !v && closePreview()}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.file_name}</DialogTitle>
            <DialogDescription className="sr-only">PDF file preview</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full flex-1 border-0 rounded"
              title={previewFile?.file_name}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} files?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected file{selectedIds.size > 1 ? "s" : ""} and
              remove them from any attached scenarios. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} files`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserFilesManager;
