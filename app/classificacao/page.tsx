
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth";
import { 
  addClassification, 
  listenToClassifications, 
  updateClassificationStatus, 
  updateClassification, 
  deleteClassification,
  sendAlert,
  listenToStorage
} from "@/lib/realtime";
import type { User } from "@/types/user";
import type { Classification, ClassificationStatus } from "@/types/classification";
import type { StorageSelection } from "@/types/storage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorageDisplay } from "@/components/storage-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "@/lib/format-date";
import { TruckStatusIcon } from "@/components/truck-status-icon";
import { ClassificationForm } from "@/components/classificacao/classification-form";
import { LiveClock } from "@/components/live-clock";
import { Truck, LogOut, MoreVertical, PlusCircle, Edit, Trash2, Search, Lock, AlertTriangle, Microscope } from 'lucide-react';

const SendAlertForm = ({ currentUser }: { currentUser: User }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendAlert = async () => {
    if (!message.trim()) {
      toast({ title: "A mensagem não pode estar vazia.", variant: "destructive" });
      return;
    }
    try {
      await sendAlert(currentUser.username, message);
      toast({ title: "Alerta enviado com sucesso!" });
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao enviar alerta:", error);
      toast({ title: "Erro ao enviar alerta", variant: "destructive" });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive"><AlertTriangle className="mr-2 h-4 w-4"/> Enviar Alerta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enviar Alerta Urgente para Operador</AlertDialogTitle>
          <AlertDialogDescription>
            Digite a mensagem de alerta. O operador receberá uma notificação visual e sonora.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          placeholder="Ex: Risco de contaminação na carga da placa ABC-1234. Inspecionar imediatamente!"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSendAlert}>Enviar Alerta</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function ClassificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [storageSelection, setStorageSelection] = useState<StorageSelection | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classificationToDelete, setClassificationToDelete] = useState<string | null>(null);
  const [searchPlate, setSearchPlate] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const user = await loadAuthSession();
        if (!user || user.department !== "classificacao") { 
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

    const unsubscribeClassifications = listenToClassifications(setClassifications);
    const unsubscribeStorage = listenToStorage(setStorageSelection);

    return () => {
      unsubscribeClassifications();
      unsubscribeStorage();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await clearAuthSession();
    router.push("/");
  };

  const showBlockedActionToast = () => {
    toast({
        title: "Ação Bloqueada",
        description: "Operador já iniciou a descarga. Não é possível alterar o passo do caminhão. Favor comunicar o administrador.",
        variant: "destructive"
    });
  }

  const handleAddClassification = async (data: Omit<Classification, "id" | "createdAt" | "status">) => {
    try {
      await addClassification(data);
      toast({ title: `Caminhão com placa ${data.plate} adicionado com sucesso!` });
    } catch (error) {
      console.error("Erro ao adicionar caminhão:", error);
      toast({ title: "Erro ao adicionar caminhão", variant: "destructive" });
    }
  };

  const handleUpdateClassification = async (id: string, data: Partial<Omit<Classification, "id">>) => {
    try {
      await updateClassification(id, data);
      toast({ title: "Registo atualizado com sucesso!" });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            showBlockedActionToast();
        } else {
            console.error("Erro ao atualizar registo:", error);
            toast({ title: "Erro ao atualizar registo", variant: "destructive" });
        }
    }
  };

  const handleDeleteClick = (id: string) => {
    setClassificationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (classificationToDelete) {
      try {
        await deleteClassification(classificationToDelete);
        toast({ title: "Registo excluído com sucesso!" });
      } catch (error: any) {
        if (error.code === 'permission-denied') {
            showBlockedActionToast();
        } else {
            console.error("Erro ao excluir registo:", error);
            toast({ title: "Erro ao excluir registo", variant: "destructive" });
        }
      }
    }
    setIsDeleteDialogOpen(false);
    setClassificationToDelete(null);
  };

  const handleChangeStatus = async (id: string, status: ClassificationStatus) => {
    if (!currentUser) return;
    try {
      await updateClassificationStatus(id, status, currentUser.username);
      toast({ title: `Status alterado para ${status}!` });
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        showBlockedActionToast();
      } else {
        console.error(`Erro ao alterar status para ${status}:`, error);
        toast({ title: `Erro ao alterar status para ${status}`, variant: "destructive" });
      }
    }
  };
  
  const filteredClassifications = classifications.filter(item => 
    item.plate.toLowerCase().includes(searchPlate.toLowerCase())
  );

  if (loading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" /></div>;
  }

  const getStatusText = (item: Classification) => {
    switch(item.status) {
      case 'liberado': return `Liberado por ${item.releasedBy}`;
      case 'recusado': return `Recusado por ${item.refusedBy}`;
      case 'descarregando': return `Em descarga por ${item.unloadingStartedBy}`;
      case 'concluido': return `Concluído por ${item.unloadingFinishedBy}`;
      case 'em-analise': return `Em análise por ${item.analysisStartedBy}`;
      default: return `Registrado por ${item.createdBy}`;
    }
  };

  const isActionLocked = (status: ClassificationStatus) => {
    return ['descarregando', 'concluido'].includes(status);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Doca de Classificação</h1>
            <p className="text-md text-gray-500 dark:text-gray-400">Gerencie os caminhões que chegam para análise de carga.</p>
          </div>
          <div className="flex-grow flex justify-center">
            <LiveClock />
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground mt-2">Usuário: {currentUser?.username}</p>
            {currentUser && <SendAlertForm currentUser={currentUser} />}
            <ClassificationForm onAddClassification={handleAddClassification} currentUser={currentUser}>
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Registrar Caminhão</Button>
            </ClassificationForm>
            <Button onClick={handleLogout} variant="outline" size="icon" title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <Tabs defaultValue="classification-panel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="classification-panel">Painel de Classificação</TabsTrigger>
                <TabsTrigger value="cells">Células em Operação</TabsTrigger>
            </TabsList>

            <TabsContent value="classification-panel">
                <Card className="shadow-lg border-2 mt-6">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Caminhões na Doca</CardTitle>
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
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {filteredClassifications.map((item) => (
                        <div 
                          key={item.id} 
                          className={`relative flex flex-col justify-between p-4 rounded-lg transition-all duration-300 
                            ${item.status === 'aguardando' ? 'bg-yellow-100/50 dark:bg-yellow-900/20 border-2 border-yellow-500/50' : ''}
                            ${item.status === 'em-analise' ? 'bg-purple-100/50 dark:bg-purple-900/20 border-2 border-purple-500/50' : ''}
                            ${item.status === 'liberado' ? 'bg-green-100/50 dark:bg-green-900/20 border-2 border-green-500/50' : ''}
                            ${item.status === 'recusado' ? 'bg-red-100/50 dark:bg-red-900/20 border-2 border-red-500/50' : ''}
                            ${item.status === 'descarregando' ? 'bg-blue-100/50 dark:bg-blue-900/20 border-2 border-blue-500/50' : ''}
                            ${item.status === 'concluido' ? 'bg-gray-100/50 dark:bg-gray-800/20 border-2 border-gray-400/50' : ''}
                          `}>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isActionLocked(item.status) ? (
                                 <DropdownMenuLabel className="flex items-center text-red-500"><Lock className="mr-2 h-4 w-4"/>Ações bloqueadas</DropdownMenuLabel>
                              ) : (
                                <>
                                 {item.status === 'aguardando' && (
                                    <>
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "liberado")}>Liberar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "em-analise")}><Microscope className="mr-2 h-4 w-4"/> Em Análise</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "recusado")}>Recusar</DropdownMenuItem>
                                    </>
                                 )}
                                 {item.status === 'recusado' && (
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "aguardando")}>Reverter para Aguardando</DropdownMenuItem>
                                 )}
                                 {item.status === 'em-analise' && (
                                    <>
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "liberado")}>Liberar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "recusado")}>Recusar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeStatus(item.id, "aguardando")}>Reverter para Aguardando</DropdownMenuItem>
                                    </>
                                 )}
                               <DropdownMenuSeparator />
                                <ClassificationForm 
                                    onUpdateClassification={handleUpdateClassification}
                                    currentUser={currentUser} 
                                    initialData={item}
                                >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                </ClassificationForm>
                              <DropdownMenuItem onClick={() => handleDeleteClick(item.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <div className="flex flex-col items-center">
                            <TruckStatusIcon status={item.status} />
                            <div className="text-center mt-4">
                              <p className="font-bold text-2xl tracking-wider font-mono">{item.plate}</p>
                              <p className="text-xs text-muted-foreground">{getStatusText(item)}</p>
                              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt))}</p>
                            </div>
                          </div>

                          <div className="mt-4 w-full text-sm space-y-1">
                            {item.product && <p><strong>Produto:</strong> {item.product}</p>}
                            {item.invoiceNumber && <p><strong>Nota:</strong> {item.invoiceNumber}</p>}
                            {item.riPercentage != null && <p><strong>R.I:</strong> {item.riPercentage}%</p>}
                            {item.humidity != null && <p><strong>Umidade:</strong> {item.humidity}%</p>}
                            {item.observations && <p className="text-xs italic"><strong>Obs:</strong> {item.observations}</p>}
                          </div>

                          <div className={`mt-4 text-center font-bold 
                            ${item.status === 'liberado' ? 'text-green-600 dark:text-green-400' : ''}
                            ${item.status === 'recusado' ? 'text-red-600 dark:text-red-400' : ''}
                            ${item.status === 'descarregando' ? 'text-blue-600 dark:text-blue-400' : ''}
                            ${item.status === 'concluido' ? 'text-gray-500 dark:text-gray-400' : ''}
                            ${item.status === 'em-analise' ? 'text-purple-600 dark:text-purple-400' : ''}
                            ${item.status === 'aguardando' ? 'text-yellow-600 dark:text-yellow-400' : ''}
                          `}>
                            {item.status.toUpperCase().replace('-', ' ')}
                          </div>
                        </div>
                      ))}
                      </div>
                      {filteredClassifications.length === 0 && (
                        <div className="text-center py-16">
                          <Truck className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600"/>
                          <p className="mt-4 text-lg font-semibold text-gray-500">Nenhum caminhão encontrado.</p>
                          <p className="text-sm text-gray-400">Ajuste a busca ou aguarde a chegada de um novo veículo.</p>
                        </div>
                      )}
                  </CardContent>
                </Card>
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

      </div>
      <Toaster />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registo será permanentemente excluído da base de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
