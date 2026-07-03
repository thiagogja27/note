
"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  listenToClassifications, 
  updateClassificationStatus,
  type Classification, 
  type ClassificationStatus
} from "@/lib/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "@/lib/format-date";
import { TruckStatusIcon } from "@/components/truck-status-icon";
import { ElapsedTime, calculateTotalDuration } from "@/components/elapsed-time";
import { speak } from "@/lib/voice-notifications";
import { Truck, Search, PlayCircle, StopCircle, Clock, Check, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";

interface PainelDeDescargaProps {
  currentUser: User | null;
  isReadOnly: boolean;
  showExportButton?: boolean;
}

export function PainelDeDescarga({ currentUser, isReadOnly, showExportButton = false }: PainelDeDescargaProps) {
  const { toast } = useToast();
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [searchPlate, setSearchPlate] = useState("");
  const prevClassificationsRef = useRef<Classification[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenToClassifications(setClassifications);
    return () => unsubscribe();
  }, [currentUser]);

  // Efeito para notificações sonoras (apenas para o painel não-somente-leitura, ou seja, operador)
  useEffect(() => {
    if (isReadOnly) return;

    classifications.forEach(current => {
        const prev = prevClassificationsRef.current.find(p => p.id === current.id);
        if (!prev || (prev.status !== current.status)) {
            if (current.status === 'liberado') {
                const message = `Caminhão liberado, placa ${current.plate.split('').join(' ')}. ${current.observations ? `Observação: ${current.observations}` : ''}`;
                speak(message);
            }
            if (current.status === 'recusado') {
                const message = `Caminhão recusado, placa ${current.plate.split('').join(' ')}. ${current.observations ? `Observação: ${current.observations}` : ''}`;
                speak(message);
            }
        }
    });
    prevClassificationsRef.current = classifications;
  }, [classifications, isReadOnly]);

  const handleChangeStatus = async (id: string, status: ClassificationStatus) => {
    if (!currentUser || isReadOnly) return;
    try {
      await updateClassificationStatus(id, status, currentUser.username);
      toast({ title: `Status alterado com sucesso!` });
    } catch (error) {
      console.error(`Erro ao alterar status:`, error);
      toast({ title: `Erro ao alterar status`, variant: "destructive" });
    }
  };

  const handleExport = () => {
    const headers = [
      "ID", "Placa", "Produto", "Nota Fiscal", "RI (%)", "Umidade (%)", "Observações", 
      "Status", "Criado Por", "Data Criação", 
      "Liberado Por", "Data Liberação", "Recusado Por", "Data Recusa",
      "Início Descarga Por", "Data Início Descarga", "Fim Descarga Por", "Data Fim Descarga",
      "Tempo na Doca (min)", "Tempo de Descarga (min)"
    ];

    const data = classifications.map(item => {
      const tempoNaDoca = item.releasedAt && item.unloadingStartedAt ? 
        ((new Date(item.unloadingStartedAt).getTime() - new Date(item.releasedAt).getTime()) / 60000).toFixed(2) : '';

      const tempoDeDescarga = item.unloadingStartedAt && item.unloadingFinishedAt ? 
        ((new Date(item.unloadingFinishedAt).getTime() - new Date(item.unloadingStartedAt).getTime()) / 60000).toFixed(2) : '';

      return [
        item.id,
        item.plate,
        item.product || '',
        item.invoiceNumber || '',
        item.riPercentage?.toString() || '',
        item.humidity?.toString() || '',
        item.observations || '',
        item.status,
        item.createdBy || '',
        item.createdAt ? format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
        item.releasedBy || '',
        item.releasedAt ? format(new Date(item.releasedAt), 'yyyy-MM-dd HH:mm:ss') : '',
        item.refusedBy || '',
        item.refusedAt ? format(new Date(item.refusedAt), 'yyyy-MM-dd HH:mm:ss') : '',
        item.unloadingStartedBy || '',
        item.unloadingStartedAt ? format(new Date(item.unloadingStartedAt), 'yyyy-MM-dd HH:mm:ss') : '',
        item.unloadingFinishedBy || '',
        item.unloadingFinishedAt ? format(new Date(item.unloadingFinishedAt), 'yyyy-MM-dd HH:mm:ss') : '',
        tempoNaDoca,
        tempoDeDescarga
      ].join(',');
    });

    const csvContent = [headers.join(','), ...data].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_descarga_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Relatório CSV gerado com sucesso!" });
  };
  
  const filteredClassifications = classifications.filter(item => 
    item.plate.toLowerCase().includes(searchPlate.toLowerCase())
  );

  const releasedTrucks = filteredClassifications.filter(item => item.status === 'liberado');
  const unloadingTrucks = filteredClassifications.filter(item => item.status === 'descarregando');
  const rejectedTrucks = filteredClassifications.filter(item => item.status === 'recusado');
  const finishedTrucks = filteredClassifications.filter(item => item.status === 'concluido').sort((a, b) => new Date(b.unloadingFinishedAt!).getTime() - new Date(a.unloadingFinishedAt!).getTime());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            type="text"
            placeholder="Buscar por placa..."
            className="pl-10 w-full max-w-sm"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value)}
          />
        </div>
        {showExportButton && (
          <Button onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Exportar Relatório (CSV)</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
        {/* Colunas... */}
        <Card className="shadow-lg border-2 border-green-500/80">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">Liberados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {releasedTrucks.map((item) => (
                <div key={item.id} className="flex flex-col justify-between p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-500/50">
                  <div className="flex flex-col items-center">
                    <TruckStatusIcon status={item.status} />
                    <div className="text-center mt-2">
                      <p className="font-bold text-2xl tracking-wider font-mono">{item.plate}</p>
                      <p className="text-xs text-muted-foreground">Liberado por {item.releasedBy}</p>
                      <p className="text-xs text-muted-foreground">{item.releasedAt && format(new Date(item.releasedAt), 'PPp')}</p>
                    </div>
                  </div>
                  {!isReadOnly && <Button className="mt-4 w-full" onClick={() => handleChangeStatus(item.id, 'descarregando')}><PlayCircle className="mr-2 h-4 w-4"/> Iniciar Descarga</Button>}
                </div>
              ))}
              {releasedTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão aguardando.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-blue-500/80">
            <CardHeader>
              <CardTitle className="text-blue-600 dark:text-blue-400">Em Descarga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {unloadingTrucks.map((item) => (
                <div key={item.id} className="flex flex-col justify-between p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-500/50">
                  <div className="flex flex-col items-center">
                    <TruckStatusIcon status={item.status} />
                    <div className="text-center mt-2">
                      <p className="font-bold text-2xl tracking-wider font-mono">{item.plate}</p>
                       <p className="text-xs text-muted-foreground">Iniciado por {item.unloadingStartedBy}</p>
                       <p className="text-xs text-muted-foreground">em {item.unloadingStartedAt && format(new Date(item.unloadingStartedAt), 'PPp')}</p>
                    </div>
                    <div className="mt-3 text-center">
                        <p className="text-xs text-muted-foreground">Tempo decorrido</p>
                        {item.unloadingStartedAt && <ElapsedTime startDate={item.unloadingStartedAt} />}
                    </div>
                  </div>
                  {!isReadOnly && <Button className="mt-4 w-full" variant="destructive" onClick={() => handleChangeStatus(item.id, 'concluido')}><StopCircle className="mr-2 h-4 w-4"/> Finalizar Descarga</Button>}
                </div>
              ))}
              {unloadingTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão descarregando.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-gray-400/80">
            <CardHeader>
              <CardTitle className="text-gray-500 dark:text-gray-400">Concluídos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {finishedTrucks.map((item) => (
                <div key={item.id} className="relative flex flex-col justify-between p-4 bg-gray-100/50 dark:bg-gray-800/20 rounded-lg border border-gray-400/50">
                  <Check className="absolute top-2 right-2 h-5 w-5 text-gray-400"/>
                  <div className="flex flex-col items-center">
                    <TruckStatusIcon status={item.status} />
                    <div className="text-center mt-2">
                      <p className="font-bold text-xl tracking-wider font-mono">{item.plate}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-center text-muted-foreground space-y-1">
                     <p><b>Início:</b> {item.unloadingStartedAt && format(new Date(item.unloadingStartedAt), 'p')}</p>
                     <p><b>Fim:</b> {item.unloadingFinishedAt && format(new Date(item.unloadingFinishedAt), 'p')}</p>
                     <div className="flex items-center justify-center gap-2 pt-1">
                        <Clock className="h-4 w-4"/>
                        <p className="font-semibold font-mono">{calculateTotalDuration(item.unloadingStartedAt, item.unloadingFinishedAt)}</p>
                     </div>
                  </div>
                </div>
              ))}
              {finishedTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão concluído.</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-2 border-red-500/80">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Recusados</CardTitle>
            </Header>
            <CardContent className="space-y-4">
              {rejectedTrucks.map((item) => (
                <div key={item.id} className="flex flex-col items-center p-4 bg-red-100/50 dark:bg-red-900/20 rounded-lg border border-red-500/50">
                  <TruckStatusIcon status={item.status} />
                  <div className="text-center mt-2">
                    <p className="font-bold text-xl tracking-wider font-mono">{item.plate}</p>
                    <p className="text-xs text-muted-foreground">Recusado por {item.refusedBy}</p>
                    <p className="text-xs text-muted-foreground">{item.refusedAt && format(new Date(item.refusedAt), 'PPp')}</p>
                  </div>
                </div>
              ))}
              {rejectedTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão recusado.</p>}
            </CardContent>
          </Card>

      </div>
    </div>
  );
}
