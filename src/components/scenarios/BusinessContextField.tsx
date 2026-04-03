import { useState } from "react";
import { Bookmark, Plus, Save, Trash2, Edit2, Check, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSavedBusinessContexts, SavedBusinessContext } from "@/hooks/useSavedBusinessContexts";
import { useAccountData } from "@/hooks/useAccountData";
import { toast } from "sonner";

interface BusinessContextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BusinessContextField({
  value,
  onChange,
  placeholder = "Describe your industry context, company specifics, constraints, and any relevant background...",
}: BusinessContextFieldProps) {
  const { contexts, saveContext, deleteContext, updateContext } = useSavedBusinessContexts();
  const { profile } = useAccountData();
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [contextName, setContextName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleSelectContext = (contextId: string) => {
    if (contextId === "__manual__") {
      setSelectedContextId(null);
      // Don't clear the value - let user type freely
      return;
    }

    const ctx = contexts.find((c) => c.id === contextId);
    if (ctx) {
      setSelectedContextId(contextId);
      onChange(ctx.content);
    }
  };

  const handleSaveContext = () => {
    if (!value.trim()) {
      toast.error("Cannot save empty context");
      return;
    }

    const saved = saveContext(contextName, value);
    setSelectedContextId(saved.id);
    setSaveDialogOpen(false);
    setContextName("");
    toast.success(`Context "${saved.name}" saved`);
  };

  const handleDeleteContext = (ctx: SavedBusinessContext, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteContext(ctx.id);
    if (selectedContextId === ctx.id) {
      setSelectedContextId(null);
    }
    toast.success(`Context "${ctx.name}" deleted`);
  };

  const handleStartEdit = (ctx: SavedBusinessContext, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(ctx.id);
    setEditingName(ctx.name);
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId && editingName.trim()) {
      updateContext(editingId, { name: editingName.trim() });
      toast.success("Context renamed");
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditingName("");
  };

  const handleContentChange = (newValue: string) => {
    onChange(newValue);
    // If we're editing a saved context, update it
    if (selectedContextId) {
      updateContext(selectedContextId, { content: newValue });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          Industry & Business Context
          <span className="text-destructive">*</span>
        </Label>
        
        {contexts.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {contexts.length} saved context{contexts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Context Selector */}
      <div className="flex gap-2">
        <Select
          value={selectedContextId || "__manual__"}
          onValueChange={handleSelectContext}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select saved context or enter manually..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__manual__">
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Enter manually
              </span>
            </SelectItem>
            {contexts.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Saved Contexts
                </div>
                {contexts.map((ctx) => (
                  <SelectItem key={ctx.id} value={ctx.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      {editingId === ctx.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="h-6 text-xs w-32"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={handleSaveEdit}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="truncate">{ctx.name}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Actions for selected context */}
        {selectedContextId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Edit2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  const ctx = contexts.find((c) => c.id === selectedContextId);
                  if (ctx) {
                    setEditingId(ctx.id);
                    setEditingName(ctx.name);
                  }
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  const ctx = contexts.find((c) => c.id === selectedContextId);
                  if (ctx) {
                    deleteContext(ctx.id);
                    setSelectedContextId(null);
                    toast.success(`Context "${ctx.name}" deleted`);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Save current as new */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              disabled={!value.trim()}
              title="Save as new context"
            >
              <Save className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Business Context</DialogTitle>
              <DialogDescription>
                Give this context a name to reuse it in future analyses.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Context Name</Label>
                <Input
                  value={contextName}
                  onChange={(e) => setContextName(e.target.value)}
                  placeholder="e.g., Automotive Manufacturing, Pharma R&D..."
                />
              </div>
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground max-h-32 overflow-y-auto">
                  {value.substring(0, 200)}
                  {value.length > 200 && "..."}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveContext}>
                <Save className="h-4 w-4 mr-2" />
                Save Context
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Textarea for content */}
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleContentChange(e.target.value)}
        className="min-h-[120px] bg-background"
        rows={5}
      />
      
      <p className="text-xs text-muted-foreground">
        Provide qualitative background that helps the AI understand your specific business 
        environment, constraints, and strategic priorities.
      </p>
    </div>
  );
}
