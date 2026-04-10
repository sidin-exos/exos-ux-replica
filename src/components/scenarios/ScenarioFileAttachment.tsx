import { useState, useEffect } from "react";
import { Paperclip, ChevronRight, FileSpreadsheet, FileText, File, Eye, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserFiles, type UserFile } from "@/hooks/useUserFiles";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FileSearchFilterBar from "@/components/files/FileSearchFilterBar";
import FilePagination from "@/components/files/FilePagination";
import { formatFileSize, getFileTypeLabel, type AllowedExtension } from "@/lib/file-validation";

const TOKEN_BUDGET_WARNING = 25_000;

const FILE_TYPE_ICONS: Record<string, typeof FileText> = {
  xlsx: FileSpreadsheet,
  docx: FileText,
  pdf: File,
};

interface ScenarioFileAttachmentProps {
  selectedFileIds: string[];
  onSelectionChange: (fileIds: string[]) => void;
}

const ScenarioFileAttachment = ({
  selectedFileIds,
  onSelectionChange,
}: ScenarioFileAttachmentProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [fileType, setFileType] = useState<AllowedExtension | null>(null);
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { files, totalCount, pageSize, isLoading, getPreviewUrl } = useUserFiles({
    search: debouncedSearch,
    fileType,
    page,
    pageSize: 10,
    paginate: true,
  });
  const [open, setOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<UserFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const hasActiveFilters = debouncedSearch !== "" || fileType !== null;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, fileType]);

  if (isLoading && !hasActiveFilters) return null;
  if (!isLoading && files.length === 0 && !hasActiveFilters) return null;

  const toggleFile = (fileId: string) => {
    if (selectedFileIds.includes(fileId)) {
      onSelectionChange(selectedFileIds.filter((id) => id !== fileId));
    } else {
      onSelectionChange([...selectedFileIds, fileId]);
    }
  };

  // Calculate total token estimate for selected files
  const totalTokens = files
    .filter((f) => selectedFileIds.includes(f.id) && f.extraction_status === "done")
    .reduce((sum, f) => sum + (f.token_estimate ?? 0), 0);

  const handlePreview = async (e: React.MouseEvent, file: UserFile) => {
    e.stopPropagation(); // Don't toggle checkbox
    try {
      const url = await getPreviewUrl(file.storage_path);
      setPreviewUrl(url);
      setPreviewFile(file);
    } catch {
      // Silent fail — preview is a nice-to-have here
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  return (
    <>
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground">
          <Paperclip className="w-4 h-4" />
          <span>
            Attach supporting documents
            {selectedFileIds.length > 0 && (
              <span className="ml-1 text-primary">
                ({selectedFileIds.length} selected)
              </span>
            )}
          </span>
          <ChevronRight
            className={`ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 border border-border rounded-lg p-4 bg-muted/30 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Select files from your account to include as context for this analysis.
          </p>
          <FileSearchFilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            fileType={fileType}
            onFileTypeChange={setFileType}
          />
          {files.length === 0 && hasActiveFilters ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No matching files
            </p>
          ) : null}
          {files.map((file) => {
            const Icon = FILE_TYPE_ICONS[file.file_type] || File;
            const isSelected = selectedFileIds.includes(file.id);
            const isExtracting = file.extraction_status === "pending" || file.extraction_status === "processing";
            const isFailed = file.extraction_status === "failed";
            const isDone = file.extraction_status === "done";

            return (
              <div
                key={file.id}
                className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 ${isExtracting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isExtracting && toggleFile(file.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => !isExtracting && toggleFile(file.id)}
                  disabled={isExtracting}
                />
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label className={`text-sm font-medium truncate block ${isExtracting ? "cursor-not-allowed" : "cursor-pointer"}`}>
                    {file.file_name}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {getFileTypeLabel(file.file_type as AllowedExtension)} · {formatFileSize(file.file_size)}
                  </span>
                </div>
                {isExtracting && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Extracting text, please wait...</TooltipContent>
                  </Tooltip>
                )}
                {isFailed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>Text extraction failed. Content won't be available to AI.</TooltipContent>
                  </Tooltip>
                )}
                {isDone && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                {file.file_type === "pdf" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={(e) => handlePreview(e, file)}
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            );
          })}
          {selectedFileIds.length > 0 && totalTokens > TOKEN_BUDGET_WARNING && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded text-xs text-amber-600 bg-amber-50">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Large documents selected — analysis quality may be affected</span>
            </div>
          )}
          <FilePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>

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
    </>
  );
};

export default ScenarioFileAttachment;
