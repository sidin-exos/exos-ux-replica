import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AllowedExtension } from "@/lib/file-validation";

const FILE_TYPE_OPTIONS: { label: string; value: AllowedExtension | null }[] = [
  { label: "All", value: null },
  { label: "Excel", value: "xlsx" },
  { label: "Word", value: "docx" },
  { label: "PDF", value: "pdf" },
];

interface FileSearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  fileType: AllowedExtension | null;
  onFileTypeChange: (value: AllowedExtension | null) => void;
}

const FileSearchFilterBar = ({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
}: FileSearchFilterBarProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {FILE_TYPE_OPTIONS.map((opt) => (
          <Button
            key={opt.label}
            variant={fileType === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFileTypeChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FileSearchFilterBar;
