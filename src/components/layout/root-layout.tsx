import { Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootLayout() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <TooltipProvider>
        <Outlet />
        <Toaster
          toastOptions={{
            classNames: {
              success: "[&_[data-icon]]:text-green-600",
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
