
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth";
import { listenToClassifications, updateClassificationStatus } from "@/lib/realtime";
import type { User } from "@/types/user";
import type { Classification, ClassificationStatus } from "@/types/classification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "@/lib/format-date";
import { TruckStatusIcon } from "@/components/truck-status-icon";
import { ElapsedTime, calculateTotalDuration } from "@/components/elapsed-time";
import { speak } from "@/lib/voice-notifications";
import { usePtt } from "@/lib/use-ptt"; // Import the PTT hook
import { PttButton } from "@/components/ui/PttButton"; // Import the PTT button
import { Truck, LogOut, Search, PlayCircle, StopCircle, Clock, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function OperatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [searchPlate, setSearchPlate] = useState("");
  const prevClassificationsRef = useRef<Classification[]>([]);

  // Initialize PTT
  const { status: pttStatus, startTransmitting, stopTransmitting } = usePtt('operador', 'classificacao');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const user = await loadAuthSession();
        if (!user || user.department !== "operador") { 
          router.push("/"); 
          return; 
        }
        setCurrentUser(user);
      } catch (error) {
        console.error("Falha ao carregar sessão:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = listenToClassifications(setClassifications);
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Voice notifications for status changes
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
  }, [classifications]);

  const handleLogout = async () => {
    await clearAuthSession();
    router.push("/");
  };

  const handleChangeStatus = async (id: string, status: ClassificationStatus) => {
    if (!currentUser) return;
    try {
      await updateClassificationStatus(id, status, currentUser.username);
      toast({ title: `Status alterado com sucesso!` });
    } catch (error) {
      console.error(`Erro ao alterar status:`, error);
      toast({ title: `Erro ao alterar status`, variant: "destructive" });
    }
  };
  
  const filteredClassifications = classifications.filter(item => 
    item.plate.toLowerCase().includes(searchPlate.toLowerCase())
  );

  const releasedTrucks = filteredClassifications.filter(item => item.status === 'liberado');
  const unloadingTrucks = filteredClassifications.filter(item => item.status === 'descarregando');
  const waitingTrucks = filteredClassifications.filter(item => item.status === 'aguardando');
  const rejectedTrucks = filteredClassifications.filter(item => item.status === 'recusado');
  const finishedTrucks = filteredClassifications.filter(item => item.status === 'concluido').sort((a, b) => new Date(b.unloadingFinishedAt!).getTime() - new Date(a.unloadingFinishedAt!).getTime());

  if (loading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-start mb-8">
           <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Painel do Operador - Tombador</h1>
            <p className="text-md text-gray-500 dark:text-gray-400">Acompanhe e gerencie o fluxo de descarga dos caminhões.</p>
          </div>
          <div className="flex items-center gap-4">
            <PttButton 
              status={pttStatus} 
              startTransmitting={startTransmitting} 
              stopTransmitting={stopTransmitting} 
            />
            <p className="text-sm text-muted-foreground mt-2">Usuário: {currentUser?.username}</p>
            <Button onClick={handleLogout} variant="outline" size="icon" title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="mb-6">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* Coluna de Liberados */}
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
                  <Button className="mt-4 w-full" onClick={() => handleChangeStatus(item.id, 'descarregando')}><PlayCircle className="mr-2 h-4 w-4"/> Iniciar Descarga</Button>
                </div>
              ))}
              {releasedTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão aguardando.</p>}
            </CardContent>
          </Card>

          {/* Coluna Em Descarga */}
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
                  <Button className="mt-4 w-full" variant="destructive" onClick={() => handleChangeStatus(item.id, 'concluido')}><StopCircle className="mr-2 h-4 w-4"/> Finalizar Descarga</Button>
                </div>
              ))}
              {unloadingTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão descarregando.</p>}
            </CardContent>
          </Card>

           {/* Coluna Concluídos */}
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
          
          {/* Coluna de Recusados */}
          <Card className="shadow-lg border-2 border-red-500/80">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Recusados</CardTitle>
            </CardHeader>
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
      <Toaster />
    </div>
  );
}
