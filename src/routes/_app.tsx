import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "../components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DollarSign, PackageMinus, PackagePlus, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="flex topbar-height shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Button variant="ghost" size="sm" onClick={() => {}} className="h-7 gap-1.5 text-xs px-2">
              <PackagePlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ingreso</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+I</kbd>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {}} className="h-7 gap-1.5 text-xs px-2">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Venta</span>
              <kbd className="kbd hidden lg:inline-flex">Ctrl+V</kbd>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground hidden sm:inline">BCV</span>
            <div className="relative">
              <Input
                // ref={rateRef}
                type="number"
                step="0.01"
                value={427.23}
                // onChange={e => setRateInput(e.target.value)}
                // onBlur={handleRateBlur}
                // onKeyDown={handleRateKey}
                // disabled={!isAdmin || saving}
                disabled={true}
                className="h-7 w-24 text-xs text-right font-mono pr-1"
              />
            </div>
            <kbd className="kbd hidden lg:inline-flex">Ctrl+B</kbd>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
