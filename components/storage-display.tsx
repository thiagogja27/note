
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StorageSelection } from "@/types/storage";

interface StorageDisplayProps {
  storageSelection: StorageSelection;
}

const CellCard = ({ title, value, operation }: { title: string, value: string | undefined, operation?: string | undefined }) => {
    const isParado = value === 'parado';
    const getOperationText = (op: string) => op === 'descarga-vagao' ? 'Desc. Vagão' : 'Desc. Caminhão';

    return (
        <div className={`p-4 rounded-lg text-center transition-all duration-300 ${isParado ? 'bg-gray-200 dark:bg-gray-700' : 'bg-green-100 dark:bg-green-900/50'}`}>
            <p className="font-semibold text-lg">{title}</p>
            <p className={`text-5xl font-bold ${isParado ? 'text-gray-500' : 'text-green-600'}`}>{isParado ? 'PARADO' : value || '-'}</p>
            {operation && !isParado && <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{getOperationText(operation)}</p>}
        </div>
    );
};

export function StorageDisplay({ storageSelection }: StorageDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* Lado TEG */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">OPERAÇÃO LADO TEG</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CellCard title="Rodovia - 01/06" value={storageSelection.tegRoad} />
          <CellCard title="Rodovia - 07" value={storageSelection.tegRoadTombador} />
          <CellCard title="Ferrovia - Moega 01" value={storageSelection.tegRailwayMoega01} operation={storageSelection.tegRailwayMoega01Operation} />
          <CellCard title="Ferrovia - Moega 02" value={storageSelection.tegRailwayMoega02} operation={storageSelection.tegRailwayMoega02Operation} />
        </CardContent>
      </Card>

      {/* Lado TEAG */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">OPERAÇÃO LADO TEAG</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CellCard title="Rodovia - Tombador 05" value={storageSelection.teagRoadTombador05} />
          <CellCard title="Ferrovia - Moega 03" value={storageSelection.teagRailwayMoega03} operation={storageSelection.teagRailwayMoega03Operation} />
          <CellCard title="Ferrovia - Moega 04" value={storageSelection.teagRailwayMoega04} operation={storageSelection.teagRailwayMoega04Operation} />
          <CellCard title="Ferrovia - Moega 05" value={storageSelection.teagRailwayMoega05} operation={storageSelection.teagRailwayMoega05Operation} />
        </CardContent>
      </Card>

    </div>
  );
}
