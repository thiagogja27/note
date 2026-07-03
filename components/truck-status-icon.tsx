
import type { ClassificationStatus } from "@/types/classification";
import { Truck, CheckCircle, XCircle, Timer, Loader, HardHat } from 'lucide-react';

interface TruckStatusIconProps {
  status: ClassificationStatus;
}

export function TruckStatusIcon({ status }: TruckStatusIconProps) {
  switch (status) {
    case 'aguardando':
      return <Timer className="h-12 w-12 text-yellow-500" />;
    case 'liberado':
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    case 'recusado':
      return <XCircle className="h-12 w-12 text-red-500" />;
    case 'descarregando':
      return <HardHat className="h-12 w-12 text-blue-500 animate-pulse" />;
    case 'concluido':
        return <Truck className="h-12 w-12 text-gray-400" />;
    default:
      return <Truck className="h-12 w-12 text-gray-500" />;
  }
}
