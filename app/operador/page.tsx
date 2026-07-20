
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth";
import { 
    listenToClassifications, type Classification,
    updateClassificationStatus, 
    listenToStorage,
    listenForAlerts,
    clearAlert,
    type OperatorAlertMessage
} from "@/lib/realtime";
import type { User } from "@/types/user";
import type { StorageSelection } from "@/types/storage";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveClock } from "@/components/live-clock";
import { TruckStatusIcon } from "@/components/truck-status-icon";
import { format, formatDistanceToNow } from "@/lib/format-date";
import { Truck, Search, Check, X, Play, Square, MessageCircle, LogOut, AlertTriangle } from 'lucide-react';
import { ElapsedTime, calculateTotalDuration } from "@/components/elapsed-time";
import { speak, stopSpeaking } from "@/lib/voice-notifications";
import { OperatorAlert } from "@/components/ui/operator-alert";
import { useChat } from "@/contexts/chat-context";
import { PrivateChat } from "@/components/private-chat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageDisplay } from "@/components/storage-display";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OperatorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { openChat } = useChat();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [storageSelection, setStorageSelection] = useState<StorageSelection | null>(null);
  const [searchPlate, setSearchPlate] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [urgentAlert, setUrgentAlert] = useState<OperatorAlertMessage | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const user = await loadAuthSession();
        if (!user || user.department !== "operador") { router.push("/"); return; }
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
    const unsubscribeClassifications = listenToClassifications((newClassifications) => {
      setClassifications(newClassifications);
      checkAndNotify(newClassifications, classifications);
    });
    const unsubscribeStorage = listenToStorage(setStorageSelection);
    const unsubscribeAlerts = listenForAlerts((alert) => {
        if (alert) {
            setUrgentAlert(alert);
            speak(`Alerta Urgente: ${alert.message}`, true);
        }
    });

    return () => {
      unsubscribeClassifications();
      unsubscribeStorage();
      unsubscribeAlerts();
    };
  }, [classifications]);

  const checkAndNotify = (newItems: Classification[], oldItems: Classification[]) => {
      if (oldItems.length === 0) return;
      
      const newReleased = newItems.filter(newItem => 
        newItem.status === 'liberado' && 
        !oldItems.find(oldItem => oldItem.id === newItem.id && oldItem.status === 'liberado')
      );
      
      newReleased.forEach(item => {
        const message = `Caminhão placa ${item.plate} liberado para descarga.`;
        setNotificationMessage(message);
        setShowNotification(true);
        speak(message);
      });
  };
  
  const handleClearAlert = async () => {
      stopSpeaking();
      await clearAlert();
      setUrgentAlert(null);
  }

  const handleLogout = async () => {
    await clearAuthSession();
    router.push("/");
  };

  const handleAction = async (id: string, action: 'start' | 'finish') => {
    if (!currentUser) return;
    try {
      if (action === 'start') {
        await updateClassificationStatus(id, "descarregando", currentUser.username);
        toast({ title: "Descarga iniciada!" });
      } else {
        await updateClassificationStatus(id, "concluido", currentUser.username);
        toast({ title: "Descarga finalizada!" });
      }
    } catch (error) {
      toast({ title: "Erro ao executar ação", variant: "destructive" });
      console.error("Action error:", error);
    }
  };

  const filteredClassifications = useMemo(() => {
    return classifications.filter(item => 
      item.plate.toLowerCase().includes(searchPlate.toLowerCase())
    );
  }, [classifications, searchPlate]);

  const analysisTrucks = useMemo(() => filteredClassifications.filter(item => item.status === 'em-analise'), [filteredClassifications]);
  const releasedTrucks = useMemo(() => filteredClassifications.filter(item => item.status === 'liberado'), [filteredClassifications]);
  const unloadingTrucks = useMemo(() => filteredClassifications.filter(item => item.status === 'descarregando'), [filteredClassifications]);
  const finishedTrucks = useMemo(() => filteredClassifications.filter(item => item.status === 'concluido').sort((a, b) => new Date(b.unloadingFinishedAt!).getTime() - new Date(a.unloadingFinishedAt!).getTime()), [filteredClassifications]);
  const rejectedTrucks = useMemo(() => filteredClassifications.filter(item => item.status === 'recusado'), [filteredClassifications]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" /></div>;
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-[1800px]">

        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel do Operador</h1>
            <p className="text-sm text-muted-foreground">Usuário: {currentUser.username}</p>
          </div>
          <div className="flex-grow flex justify-center">
            <LiveClock />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => openChat()} title="Chat Privado"><MessageCircle className="h-4 w-4" /></Button>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} title="Sair"><LogOut className="h-4 w-4" /></Button>
          </div>
        </header>

        {showNotification && 
          <OperatorAlert 
            message={notificationMessage} 
            onClose={() => setShowNotification(false)} 
          />
        }

        <Tabs defaultValue="discharge-panel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="discharge-panel">Painel de Descarga</TabsTrigger>
                <TabsTrigger value="cells">Células em Operação</TabsTrigger>
            </TabsList>

            <TabsContent value="discharge-panel">
                <div className="mt-6 mb-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  
                  <Card className="shadow-lg border-2 border-purple-500/80">
                    <CardHeader>
                      <CardTitle className="text-purple-600 dark:text-purple-400">Caminhões em Análise</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisTrucks.map((item) => (
                        <div key={item.id} className="p-4 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-500/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TruckStatusIcon status={item.status} />
                                <div>
                                    <p className="font-bold text-2xl tracking-wider font-mono">{item.plate}</p>
                                    <p className="text-xs text-muted-foreground">Em análise por {item.analysisStartedBy}</p>
                                    <p className="text-xs text-muted-foreground">{item.analysisStartedAt && format(new Date(item.analysisStartedAt), 'PPp')}</p>
                                </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {analysisTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão em análise.</p>}
                    </CardContent>
                  </Card>

                  
                  <Card className="shadow-lg border-2 border-green-500/80">
                    <CardHeader>
                      <CardTitle className="text-green-600 dark:text-green-400">Caminhões Liberados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {releasedTrucks.map((item) => (
                        <div key={item.id} className="p-4 bg-green-100/50 dark:bg-green-900/20 rounded-lg border border-green-500/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TruckStatusIcon status={item.status} />
                                <div>
                                    <p className="font-bold text-2xl tracking-wider font-mono">{item.plate}</p>
                                    <p className="text-xs text-muted-foreground">Liberado por {item.releasedBy}</p>
                                    <p className="text-xs text-muted-foreground">{item.releasedAt && format(new Date(item.releasedAt), 'PPp')}</p>
                                </div>
                            </div>
                            <Button 
                              size="icon" 
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12"
                              onClick={() => handleAction(item.id, 'start')}
                              title="Iniciar Descarga"
                            >
                              <Play className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {releasedTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão liberado.</p>}
                    </CardContent>
                  </Card>

                 
                  <Card className="shadow-lg border-2 border-blue-500/80">
                    <CardHeader>
                      <CardTitle className="text-blue-600 dark:text-blue-400">Em Descarga</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {unloadingTrucks.map((item) => (
                        <div key={item.id} className="p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-500/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TruckStatusIcon status={item.status} />
                                <div>
                                  <p className="font-bold text-2xl tracking-wider font-mono">{item.plate}</p>
                                  <p className="text-xs text-muted-foreground">Iniciado por {item.unloadingStartedBy}</p>
                                   <div className="text-xs text-muted-foreground">
                                     {item.unloadingStartedAt && <ElapsedTime startDate={item.unloadingStartedAt} />}
                                   </div>
                                </div>
                            </div>
                             <Button 
                              size="icon" 
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-12 h-12"
                              onClick={() => handleAction(item.id, 'finish')}
                              title="Finalizar Descarga"
                            >
                              <Square className="h-6 w-6" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {unloadingTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão descarregando.</p>}
                    </CardContent>
                  </Card>

                  
                  <Card className="shadow-lg border-2 border-gray-400/80">
                    <CardHeader>
                      <CardTitle className="text-gray-500 dark:text-gray-400">Concluídos Recentemente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {finishedTrucks.slice(0, 5).map((item) => (
                        <div key={item.id} className="relative p-4 bg-gray-100/50 dark:bg-gray-800/20 rounded-lg border border-gray-400/50">
                          <Check className="absolute top-2 right-2 h-5 w-5 text-gray-400"/>
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                               <TruckStatusIcon status={item.status} />
                               <div>
                                 <p className="font-bold text-xl tracking-wider font-mono">{item.plate}</p>
                                 <p className="text-xs text-muted-foreground">Finalizado por {item.unloadingFinishedBy}</p>
                                 <p className="text-xs text-muted-foreground">{formatDistanceToNow(item.unloadingFinishedAt!)}</p>
                               </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-semibold">Duração</p>
                                <p className="font-mono text-lg">{calculateTotalDuration(item.unloadingStartedAt, item.unloadingFinishedAt)}</p>
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
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {rejectedTrucks.map((item) => (
                        <div key={item.id} className="p-4 bg-red-100/50 dark:bg-red-900/20 rounded-lg border border-red-500/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <TruckStatusIcon status={item.status} />
                                <div>
                                    <p className="font-bold text-xl tracking-wider font-mono">{item.plate}</p>
                                    <p className="text-xs text-muted-foreground">Recusado por {item.refusedBy}</p>
                                    <p className="text-xs text-muted-foreground">{item.refusedAt && format(new Date(item.refusedAt), 'PPp')}</p>
                                </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {rejectedTrucks.length === 0 && <p className="text-center text-sm text-gray-500 py-10">Nenhum caminhão recusado.</p>}
                    </CardContent>
                  </Card>

                </div>
            </TabsContent>

            <TabsContent value="cells">
                <div className="mt-6">
                    {storageSelection ? (
                        <StorageDisplay storageSelection={storageSelection} />
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-10">Carregando informações das células...</p>
                    )}
                </div>
            </TabsContent>
        </Tabs>

        <AlertDialog open={!!urgentAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="text-red-500 mr-2 h-6 w-6"/>
                        Alerta Urgente da Classificação
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        <strong>Enviado por: {urgentAlert?.from}</strong>
                        <p className="text-lg mt-2">{urgentAlert?.message}</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction onClick={handleClearAlert}>OK</AlertDialogAction>
            </AlertDialogContent>
        </AlertDialog>

      </div>
      {currentUser && <PrivateChat currentUser={currentUser} />}
      <Toaster />
    </div>
  );
}
