import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/components/layout/hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-warning/15 border-warning/30 flex items-center gap-2 border-b px-3 py-1.5 md:px-4">
      <WifiOff className="text-warning h-3.5 w-3.5 shrink-0" />
      <p className="text-warning text-xs font-semibold">
        Sin conexión a internet
        <span className="hidden sm:inline"> — Los cambios no se guardarán hasta recuperar la señal</span>
      </p>
    </div>
  );
}
