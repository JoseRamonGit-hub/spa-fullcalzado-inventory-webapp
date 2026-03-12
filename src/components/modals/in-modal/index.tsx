import { useState } from "react";
import { ResponsiveModal } from "@/components/ResponsiveModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PackagePlus, Plus } from "lucide-react";
import { NewProductForm } from "./components/new-product-form";
import { StockIncreaseForm } from "./components/stock-increase-form";

interface InModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InModal({ open, onOpenChange }: InModalProps) {
  const [activeTab, setActiveTab] = useState("new");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setActiveTab("new");
    }
    onOpenChange(open);
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange} title="Registrar Ingreso">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="new" className="text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nuevo Producto
          </TabsTrigger>
          <TabsTrigger value="stock" className="text-xs">
            <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
            Aumentar Stock
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: New Product */}
        <TabsContent value="new">
          <NewProductForm onSuccess={handleSuccess} />
        </TabsContent>

        {/* Tab 2: Stock Increase */}
        <TabsContent value="stock">
          <StockIncreaseForm onSuccess={handleSuccess} />
        </TabsContent>
      </Tabs>
    </ResponsiveModal>
  );
}
