import { Plus, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Supplier {
  id: string;
  name: string;
  category: string;
  annualSpend: string;
  contractEnd?: string;
}

interface SupplierInputProps {
  suppliers: Supplier[];
  onSuppliersChange: (suppliers: Supplier[]) => void;
}

const categories = [
  "Logistics",
  "IT/SaaS",
  "Office Supplies",
  "Raw Materials",
  "Professional Services",
  "Marketing",
  "Other",
];

const SupplierInput = ({ suppliers, onSuppliersChange }: SupplierInputProps) => {
  const addSupplier = () => {
    const newSupplier: Supplier = {
      id: crypto.randomUUID(),
      name: "",
      category: "",
      annualSpend: "",
    };
    onSuppliersChange([...suppliers, newSupplier]);
  };

  const removeSupplier = (id: string) => {
    onSuppliersChange(suppliers.filter((s) => s.id !== id));
  };

  const updateSupplier = (id: string, field: keyof Supplier, value: string) => {
    onSuppliersChange(
      suppliers.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Supplier Data</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Add suppliers in the category you want to consolidate
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addSupplier}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No suppliers added yet. Click "Add Supplier" to get started.
            </p>
          </div>
        ) : (
          suppliers.map((supplier, index) => (
            <div
              key={supplier.id}
              className="card-elevated rounded-xl p-4 animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Supplier Name
                  </Label>
                  <Input
                    placeholder="e.g., Acme Corp"
                    value={supplier.name}
                    onChange={(e) =>
                      updateSupplier(supplier.id, "name", e.target.value)
                    }
                    className="bg-background"
                  />
                </div>

                <div className="md:col-span-3">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Category
                  </Label>
                  <Select
                    value={supplier.category}
                    onValueChange={(value) =>
                      updateSupplier(supplier.id, "category", value)
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-3">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Annual Spend ($)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50000"
                    value={supplier.annualSpend}
                    onChange={(e) =>
                      updateSupplier(supplier.id, "annualSpend", e.target.value)
                    }
                    className="bg-background"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSupplier(supplier.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupplierInput;
