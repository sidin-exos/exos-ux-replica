import { useState, useEffect } from "react";
import { Paperclip, ChevronRight, FileSpreadsheet, FileText, File } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useUserFiles } from "@/hooks/useUserFiles";
import { useDebounce } from "@/hooks/useDebounce";
import FileSearchFilterBar from "@/components/files/FileSearchFilterBar";
import FilePagination from "@/components/files/FilePagination";
import { formatFileSize, getFileTypeLabel, type AllowedExtension } from "@/lib/file-validation";

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

  const { files, totalCount, pageSize, isLoading } = useUserFiles({
    search: debouncedSearch,
    fileType,
    page,
    pageSize: 10,
    paginate: true,
  });
  const [open, setOpen] = useState(false);

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

  return (
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

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleFile(file.id)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleFile(file.id)}
                />
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium cursor-pointer truncate block">
                    {file.file_name}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {getFileTypeLabel(file.file_type as AllowedExtension)} · {formatFileSize(file.file_size)}
                  </span>
                </div>
              </div>
            );
          })}
          <FilePagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ScenarioFileAttachment;
