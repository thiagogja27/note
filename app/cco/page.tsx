
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { loadAuthSession, clearAuthSession } from "@/lib/firebase-auth";
import {
  listenToNotes,
  listenToRadarNotes,
  listenToStorage,
  listenToStorageLogs,
  saveStorageSelection,
  addNote,
  updateNote,
  deleteNote,
  toggleNoteCompleted,
  saveSpoutTrack,
  listenToSpoutTrack,
  updateSpoutTrack,
  deleteSpoutTrack
} from "@/lib/realtime";
import { exportStorageLogsToExcel, exportSpoutTracksToExcel } from "@/lib/export";
import type { Note, Category } from "@/types/note";
import type { StorageLog } from "@/types/storage";
import type { User } from "@/types/user";
import type { SpoutTrack } from "@/types/spout-track";
import { RADAR_CATEGORY } from "@/types/note";
import { formatDistanceToNow } from "@/lib/format-date";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { RadarSummary } from "@/components/RadarSummary";
import { BookOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Download, MessageCircle, Save, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveClock } from "@/components/live-clock";
import { useChat } from "@/contexts/chat-context";
import { PrivateChat } from "@/components/private-chat";
import { AnimatedHeader } from "@/components/animated-header";
import { Dashboard } from "@/components/dashboard";
import { TimelineBar } from "@/components/timeline-bar";
import { PainelDeDescargaCCO } from "@/components/cco/painel-de-descarga-cco"; // Importar o novo componente

const CCO_CATEGORIES: Category[] = ["Emails", "Incluir no relatório de balança", "Tarefas pendentes"];
const TEG_CELLS = ["A1", "B1", "C1", "A2", "B2"];
const TEAG_CELLS = ["A3", "B3", "A4"];
const TEG_BELTS = ["BC205A", "TC203", "TC204", "TC212"];
const TEAG_BELTS = ["BC4001A", "BC5001A"];
const TEG_UNLOADING_POINTS = ["TD1", "TD6", "TD7", "Moega 1", "Moega 2"];
const TEAG_UNLOADING_POINTS = ["TD5", "Moega 3", "Moega 4", "Moega 5"];
const PRODUCT_OPTIONS = ["Soja", "Açúcar", "Milho"];

export default function CCOPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { openChat } = useChat();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [radarNotes, setRadarNotes] = useState<Note[]>([]);
  const [storageSelection, setStorageSelection] = useState<any | null>(null);
  const [storageLogs, setStorageLogs] = useState<StorageLog[]>([]);
  const [spoutTracks, setSpoutTracks] = useState<SpoutTrack[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // States for Spout Track filtering
  const [spoutStartDateFilter, setSpoutStartDateFilter] = useState("");
  const [spoutEndDateFilter, setSpoutEndDateFilter] = useState("");

  const [newNoteInputs, setNewNoteInputs] = useState<Record<Category, string>>({ Emails: "", "Incluir no relatório de balança": "", "Tarefas pendentes": "" });
  const [newRadarInput, setNewRadarInput] = useState("");
  const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);
  
  const [editingSpoutTrack, setEditingSpoutTrack] = useState<Partial<SpoutTrack> | null>(null);

  const [spoutNumber, setSpoutNumber] = useState("");
  const [spoutDestination, setSpoutDestination] = useState<'TEAG' | 'TEG' | "">("");
  const [spoutCell, setSpoutCell] = useState("");
  const [spoutBelt, setSpoutBelt] = useState("");
  const [spoutUnloadingPoint, setSpoutUnloadingPoint] = useState("");
  const [spoutProduct, setSpoutProduct] = useState("");
  const [spoutStartDate, setSpoutStartDate] = useState("");
  const [spoutStartTime, setSpoutStartTime] = useState("");
  const [spoutEndDate, setSpoutEndDate] = useState("");
  const [spoutEndTime, setSpoutEndTime] = useState("");
  const [spoutObservations, setSpoutObservations] = useState("");


  useEffect(() => {
    const loadSession = async () => {
      try {
        const user = await loadAuthSession();
        if (!user || user.department !== "cco") { router.push("/"); return; }
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
    const unsubscribers = [
      listenToNotes(currentUser.id, setNotes),
      listenToRadarNotes(setRadarNotes),
      listenToStorage(setStorageSelection),
      listenToStorageLogs(setStorageLogs),
      listenToSpoutTrack(setSpoutTracks)
    ];
    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser]);

  const filteredSpoutTracks = useMemo(() => {
    return spoutTracks.filter(track => {
      const trackDate = new Date(track.startTimestamp);
      const start = spoutStartDateFilter ? new Date(`${spoutStartDateFilter}T00:00:00`) : null;
      const end = spoutEndDateFilter ? new Date(`${spoutEndDateFilter}T23:59:59`) : null;
      if (start && trackDate < start) return false;
      if (end && trackDate > end) return false;
      return true;
    });
  }, [spoutTracks, spoutStartDateFilter, spoutEndDateFilter]);

  const timelineBounds = useMemo(() => {
    if (filteredSpoutTracks.length < 2) return { min: 0, max: 0 };
    const timestamps = filteredSpoutTracks.flatMap(t => [
        new Date(t.startTimestamp).getTime(), 
        new Date(t.endTimestamp).getTime()
    ]);
    return {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps),
    };
  }, [filteredSpoutTracks]);

  const handleExportStorage = () => {
    if (storageLogs.length === 0) {
        toast({ title: "Nenhum dado para exportar", variant: "destructive" });
        return;
    }

    const filteredLogs = storageLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

        if (start && logDate < start) return false;
        if (end && logDate > end) return false;
        return true;
    });

    if (filteredLogs.length === 0) {
        toast({ title: "Nenhum registro no período selecionado", variant: "destructive" });
        return;
    }

    const fileName = `Historico_Operacao_${startDate || 'inicio'}_a_${endDate || 'hoje'}`;
    exportStorageLogsToExcel(filteredLogs, fileName);
    toast({ title: "Exportação Concluída", description: `${filteredLogs.length} registros exportados.` });
  };

  const handleExportSpoutTracks = () => {
    if (filteredSpoutTracks.length === 0) {
      toast({ title: "Nenhum dado para exportar", description: "Nenhum registro encontrado para o período selecionado.", variant: "destructive" });
      return;
    }
    const fileName = `Historico_Bicas_${spoutStartDateFilter || 'inicio'}_a_${spoutEndDateFilter || 'hoje'}`;
    exportSpoutTracksToExcel(filteredSpoutTracks, fileName);
    toast({ title: "Exportação Concluída", description: `${filteredSpoutTracks.length} registros exportados.` });
  };

  const handleLogout = async () => {
    await clearAuthSession();
    router.push("/");
  };

  const handleSaveSpoutTrack = async () => {
    if (!spoutNumber.trim() || !spoutDestination || !spoutCell || !spoutUnloadingPoint.trim() || !spoutProduct.trim() || !spoutStartDate || !spoutStartTime || !spoutEndDate || !spoutEndTime || !currentUser) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    try {
      const startTimestamp = new Date(`${spoutStartDate}T${spoutStartTime}`).toISOString();
      const endTimestamp = new Date(`${spoutEndDate}T${spoutEndTime}`).toISOString();

      await saveSpoutTrack({
        spoutNumber,
        destination: spoutDestination as 'TEAG' | 'TEG',
        cell: spoutCell,
        belt: spoutBelt,
        unloadingPoint: spoutUnloadingPoint,
        product: spoutProduct,
        operator: currentUser.username,
        startTimestamp,
        endTimestamp,
        observations: spoutObservations,
        isOccurrence: false,
      });
      toast({ title: "Registro de bica salvo com sucesso!" });
      setSpoutNumber("");
      setSpoutDestination("");
      setSpoutCell("");
      setSpoutBelt("");
      setSpoutUnloadingPoint("");
      setSpoutProduct("");
      setSpoutStartDate("");
      setSpoutStartTime("");
      setSpoutEndDate("");
      setSpoutEndTime("");
      setSpoutObservations("");
    } catch (error) {
      console.error("Spout track save failed:", error);
      toast({ title: "Erro ao salvar registro", variant: "destructive" });
    }
  };

  const handleUpdateSpoutTrack = async () => {
    if (!editingSpoutTrack || !editingSpoutTrack.id || !currentUser) return;

    try {
      const startTimestamp = new Date(`${editingSpoutTrack.spoutStartDate}T${editingSpoutTrack.spoutStartTime}`).toISOString();
      const endTimestamp = new Date(`${editingSpoutTrack.spoutEndDate}T${editingSpoutTrack.spoutEndTime}`).toISOString();

      const dataToUpdate = { ...editingSpoutTrack, operator: currentUser.username, startTimestamp, endTimestamp };

      await updateSpoutTrack(editingSpoutTrack.id, dataToUpdate);
      toast({ title: "Registro atualizado com sucesso!" });
      setEditingSpoutTrack(null);
    } catch (error) {
      console.error("Spout track update failed:", error);
      toast({ title: "Erro ao atualizar registro", variant: "destructive" });
    }
  };
  
  const handleToggleOccurrence = async (track: SpoutTrack) => {
    try {
      await updateSpoutTrack(track.id, { isOccurrence: !track.isOccurrence });
      toast({ 
        title: `Ocorrência ${!track.isOccurrence ? 'marcada' : 'desmarcada'}`,
        description: `O registro da bica ${track.spoutNumber} foi atualizado.`
      });
    } catch (error) {
      console.error("Failed to toggle occurrence:", error);
      toast({ title: "Erro ao atualizar ocorrência", variant: "destructive" });
    }
  };

  const handleDeleteSpoutTrack = async (id: string) => {
    const confirmed = window.confirm("Você tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.");
    if (confirmed) {
      try {
        await deleteSpoutTrack(id);
        toast({ title: "Registro excluído com sucesso!" });
      } catch (error) {
        console.error("Spout track delete failed:", error);
        toast({ title: "Erro ao excluir registro", variant: "destructive" });
      }
    }
  };

  const handleStartEditSpoutTrack = (track: SpoutTrack) => {
    const start = new Date(track.startTimestamp);
    const end = new Date(track.endTimestamp);
    setEditingSpoutTrack({
      ...track,
      spoutStartDate: start.toISOString().split('T')[0],
      spoutStartTime: start.toTimeString().split(' ')[0].substring(0, 5),
      spoutEndDate: end.toISOString().split('T')[0],
      spoutEndTime: end.toTimeString().split(' ')[0].substring(0, 5),
    });
  };


  const handleStorageChange = (field: keyof Omit<any, 'id' | 'updatedAt' | 'updatedBy' | 'updatedByDepartment'>, value: string) => {
    if (!currentUser) return;

    const newSelection = { ...(storageSelection || {}), [field]: value };
    setStorageSelection(newSelection);

    const performSave = async () => {
      try {
        await saveStorageSelection({
          ...newSelection,
          updatedBy: currentUser.username,
          updatedByDepartment: currentUser.department,
        });
        
        const fieldNames: Record<string, string> = {
            tegRoad: "TEG Rod. 01/06",
            tegRoadTombador: "TEG Rod. 07",
            tegRailwayMoega01: "TEG Ferr. 01",
            tegRailwayMoega02: "TEG Ferr. 02",
            teagRoad: "TEAG Rodovia",
            teagRailway: "TEAG Ferrovia",
            teagRoadTombador05: "TEAG Rod. 05",
            teagRailwayMoega03: "TEAG Ferr. 03",
            teagRailwayMoega04: "TEAG Ferr. 04",
            teagRailwayMoega05: "TEAG Ferr. 05",
            tegRailwayMoega01Operation: "Operação TEG Ferr. 01",
            tegRailwayMoega02Operation: "Operação TEG Ferr. 02",
            tegRailwayMoega03Operation: "Operação TEAG Ferr. 03",
            tegRailwayMoega04Operation: "Operação TEAG Ferr. 04",
            tegRailwayMoega05Operation: "Operação TEAG Ferr. 05",
        };

        const isOperationField = field.toLowerCase().includes('operation');
        const displayValue = isOperationField ? (value === 'descarga-vagao' ? 'Descarga Vagão' : 'Descarga Caminhão') : value;
        
        const alertMessage = `🚨 ALTERAÇÃO DE ${isOperationField ? 'OPERAÇÃO' : 'CÉLULA'}: ${fieldNames[field]} alterada para ${displayValue}`;
        
        if (!isOperationField) {
          await addNote({ title: alertMessage, content: alertMessage, category: RADAR_CATEGORY, userId: currentUser.id, createdBy: currentUser.username, createdByDepartment: currentUser.department, completed: false });
        }
        
        toast({ title: "Estocagem Atualizada", description: `${fieldNames[field]} foi definida como ${displayValue}.` });

      } catch (error) {
        console.error("Save failed:", error);
        toast({title: "Erro ao salvar alteração", variant: "destructive"});
      }
    };
    
    performSave();
  };

  const formatChanges = (changes: StorageLog['changes']) => {
    return Object.entries(changes).filter(([, value]) => value).map(([key, value]) => {
        let displayValue = value;
        if (key.toLowerCase().includes('operation')) {
            displayValue = value === 'descarga-vagao' ? 'Desc. Vagão' : 'Desc. Caminhão';
        }
        const displayKey = key.replace('teg', 'TEG ').replace('teag', 'TEAG ').replace('Road', 'Rod.').replace('Railway', 'Ferr.').replace('Moega', 'M.').replace('Tombador', 'Tombador').replace('Operation', ' Op.');
        return `${displayKey}: ${displayValue}`;
    }).join(" | ") || "N/A";
  };
  
  const handleAddOrUpdateNote = async (category: Category | 'RADAR', content: string, id?: string) => {
    if (!content.trim() || !currentUser) return;

    try {
      if (id) {
        await updateNote(id, { content }, currentUser.username, currentUser.department);
        toast({ title: "Item atualizado!" });
      } else {
        await addNote({ title: content.substring(0,30), content, category, userId: currentUser.id, createdBy: currentUser.username, createdByDepartment: currentUser.department, completed: false });
        toast({ title: `Adicionado em ${category}!` });
      }
      if (category === 'RADAR') setNewRadarInput("");
      else setNewNoteInputs(prev => ({ ...prev, [category]: "" }));
      setEditingNote(null); 
    } catch (error) {
      toast({ title: "Erro ao salvar item", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    try {
      await deleteNote(id, currentUser.username, currentUser.department);
      toast({ title: "Item removido" });
    } catch (error) {
      toast({ title: "Erro ao remover item", variant: "destructive" });
    }
  }

  const handleToggle = async (note: Note) => {
      if (!currentUser) return;
      try {
          await toggleNoteCompleted(note.id, !note.completed, currentUser.username, currentUser.department);
      } catch (error) {
          toast({ title: "Erro ao marcar item", variant: "destructive" });
      }
  }
  
  const handleStartEdit = (note: Note) => {
      setEditingNote({ id: note.id, content: note.content });
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" /></div>;
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <AnimatedHeader />
      <div className="container mx-auto px-4 pt-40 pb-6 max-w-[1600px]">
        <header className="mb-6 grid grid-cols-3 items-center">
          <div className="col-span-1">
            <h1 className="text-2xl font-bold">CCO - Centro de Controle Operacional</h1>
            <p className="text-sm text-muted-foreground">Usuário: {currentUser.username}</p>
          </div>
          <div className="col-span-1">
            <LiveClock />
          </div>
          <div className="col-span-1 flex items-center justify-end gap-2">
            <Button variant="outline" size="icon" onClick={() => openChat()} title="Chat Privado"><MessageCircle className="h-4 w-4" /></Button>
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
        </header>

        <div className="my-6">
            <RadarSummary radarNotes={radarNotes} />
        </div>

        <Tabs defaultValue="storage" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="storage">Controle de Operação e Célula</TabsTrigger>
            <TabsTrigger value="spout-tracking">Rastreabilidade de Bicas</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="discharge-panel">Painel de Descarga</TabsTrigger> {/* Alterado */}
            <TabsTrigger value="notes">Anotações</TabsTrigger>
            <TabsTrigger value="radar">RADAR</TabsTrigger>
          </TabsList>

          <TabsContent value="storage">
            <div className="space-y-6 mt-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-primary">Definir Operação e Célula</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                      <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Lado TEG</h3>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Rodovia - Tombadores 01 e 06:</label>
                              <Select id="teg-road" onValueChange={(v) => handleStorageChange("tegRoad", v)} value={storageSelection?.tegRoad || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Rodovia - Tombador 07:</label>
                              <Select id="teg-road-tombador" onValueChange={(v) => handleStorageChange("tegRoadTombador", v)} value={storageSelection?.tegRoadTombador || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 01:</label>
                              <div className="flex gap-2">
                                <Select id="teg-railway-moega-01-cell" onValueChange={(v) => handleStorageChange("tegRailwayMoega01", v)} value={storageSelection?.tegRailwayMoega01 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teg-railway-moega-01-operation" onValueChange={(v) => handleStorageChange("tegRailwayMoega01Operation", v)} value={storageSelection?.tegRailwayMoega01Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 02:</label>
                              <div className="flex gap-2">
                                <Select id="teg-railway-moega-02-cell" onValueChange={(v) => handleStorageChange("tegRailwayMoega02", v)} value={storageSelection?.tegRailwayMoega02 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teg-railway-moega-02-operation" onValueChange={(v) => handleStorageChange("tegRailwayMoega02Operation", v)} value={storageSelection?.tegRailwayMoega02Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Lado TEAG</h3>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Rodovia - Tombador 05:</label>
                            <Select id="teag-road-tombador-05" onValueChange={(v) => handleStorageChange("teagRoadTombador05", v)} value={storageSelection?.teagRoadTombador05 || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 03:</label>
                             <div className="flex gap-2">
                                <Select id="teag-railway-moega-03-cell" onValueChange={(v) => handleStorageChange("teagRailwayMoega03", v)} value={storageSelection?.teagRailwayMoega03 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teag-railway-moega-03-operation" onValueChange={(v) => handleStorageChange("teagRailwayMoega03Operation", v)} value={storageSelection?.teagRailwayMoega03Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 04:</label>
                             <div className="flex gap-2">
                                <Select id="teag-railway-moega-04-cell" onValueChange={(v) => handleStorageChange("teagRailwayMoega04", v)} value={storageSelection?.teagRailwayMoega04 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teag-railway-moega-04-operation" onValueChange={(v) => handleStorageChange("teagRailwayMoega04Operation", v)} value={storageSelection?.teagRailwayMoega04Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 05:</label>
                             <div className="flex gap-2">
                                <Select id="teag-railway-moega-05-cell" onValueChange={(v) => handleStorageChange("teagRailwayMoega05", v)} value={storageSelection?.teagRailwayMoega05 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teag-railway-moega-05-operation" onValueChange={(v) => handleStorageChange("teagRailwayMoega05Operation", v)} value={storageSelection?.teagRailwayMoega05Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-primary">Histórico de Alterações</h2>
                  <div className="flex flex-wrap items-center gap-2">
                      <Input id="history-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
                      <span className="text-muted-foreground">até</span>
                      <Input id="history-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
                      <Button onClick={handleExportStorage} disabled={storageLogs.length === 0} variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Excel
                      </Button>
                  </div>
                </div>
                <div className="overflow-x-auto relative max-h-[500px]">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3">Data & Hora</th>
                        <th scope="col" className="px-6 py-3">Usuário</th>
                        <th scope="col" className="px-6 py-3">Detalhes da Alteração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageLogs.map(log => (
                        <tr key={log.id} className="border-b hover:bg-secondary/50">
                          <td className="px-6 py-4 font-medium whitespace-nowrap">{new Date(log.timestamp).toLocaleString("pt-BR")}</td>
                          <td className="px-6 py-4">{log.changedBy} ({log.department.toUpperCase()})</td>
                          <td className="px-6 py-4">{formatChanges(log.changes)}</td>
                        </tr>
                      ))}
                       {storageLogs.length === 0 && (
                          <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum registro de alteração encontrado.</td></tr>
                       )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="spout-tracking">
            <div className="space-y-6 mt-6">
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-primary">Rastreabilidade de Bicas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-8 gap-y-4 mb-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Bica(s)</label>
                      <Input placeholder="Ex: 1, 2, 5-8" value={spoutNumber} onChange={(e) => setSpoutNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Destino</label>
                      <Select onValueChange={(v) => { setSpoutDestination(v as any); setSpoutCell(""); setSpoutBelt(""); setSpoutUnloadingPoint(""); }} value={spoutDestination}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="TEAG">Lado TEAG</SelectItem><SelectItem value="TEG">Lado TEG</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Local de Descarga</label>
                      <Select onValueChange={(v) => setSpoutUnloadingPoint(v)} value={spoutUnloadingPoint} disabled={!spoutDestination}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>
                        {(spoutDestination === 'TEG' ? TEG_UNLOADING_POINTS : TEAG_UNLOADING_POINTS).map(point => <SelectItem key={point} value={point}>{point}</SelectItem>)}
                      </SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Célula</label>
                      <Select onValueChange={(v) => setSpoutCell(v)} value={spoutCell} disabled={!spoutDestination}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>
                        {(spoutDestination === 'TEG' ? TEG_CELLS : TEAG_CELLS).map(cell => <SelectItem key={cell} value={cell}>{cell}</SelectItem>)}
                      </SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Correia</label>
                      <Select onValueChange={(v) => setSpoutBelt(v)} value={spoutBelt} disabled={!spoutDestination}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>
                        {(spoutDestination === 'TEG' ? TEG_BELTS : TEAG_BELTS).map(belt => <SelectItem key={belt} value={belt}>{belt}</SelectItem>)}
                      </SelectContent></Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Produto</label>
                      <Select onValueChange={(v) => setSpoutProduct(v)} value={spoutProduct}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>
                        {PRODUCT_OPTIONS.map(prod => <SelectItem key={prod} value={prod}>{prod}</SelectItem>)}
                      </SelectContent></Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Início da Descarga</label>
                      <Input type="date" value={spoutStartDate} onChange={(e) => setSpoutStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground invisible">Hora Início</label>
                      <Input type="time" value={spoutStartTime} onChange={(e) => setSpoutStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Fim da Descarga</label>
                      <Input type="date" value={spoutEndDate} onChange={(e) => setSpoutEndDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground invisible">Hora Fim</label>
                      <Input type="time" value={spoutEndTime} onChange={(e) => setSpoutEndTime(e.target.value)} />
                    </div>
                </div>
                 <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    <Textarea placeholder="Detalhes da operação, ex: produto com odor estranho, descarga interrompida..." value={spoutObservations} onChange={(e) => setSpoutObservations(e.target.value)} className="mt-1.5" />
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveSpoutTrack}>Salvar Registro</Button>
                </div>
              </div>
              <div className="bg-card border rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-primary">Histórico de Bicas</h2>
                  <div className="flex flex-wrap items-center gap-2">
                      <Input type="date" value={spoutStartDateFilter} onChange={e => setSpoutStartDateFilter(e.target.value)} className="w-auto" />
                      <span className="text-muted-foreground">até</span>
                      <Input type="date" value={spoutEndDateFilter} onChange={e => setSpoutEndDateFilter(e.target.value)} className="w-auto" />
                      <Button onClick={handleExportSpoutTracks} disabled={filteredSpoutTracks.length === 0} variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exportar Excel
                      </Button>
                  </div>
                </div>
                <div className="overflow-x-auto relative max-h-[600px]">
                  <table className="w-full text-sm text-left table-fixed">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary sticky top-0">
                      <tr>
                        <th scope="col" className="w-16 px-2 py-3 text-center"><AlertTriangle className="h-4 w-4 mx-auto"/></th>
                        <th scope="col" className="w-24 px-4 py-3">Bica(s)</th>
                        <th scope="col" className="w-28 px-4 py-3">Produto</th>
                        <th scope="col" className="w-24 px-4 py-3">Destino</th>
                        <th scope="col" className="w-32 px-4 py-3">Local Descarga</th>
                        <th scope="col" className="w-24 px-4 py-3">Célula</th>
                        <th scope="col" className="w-24 px-4 py-3">Correia</th>
                        <th scope="col" className="w-40 px-4 py-3">Início</th>
                        <th scope="col" className="w-40 px-4 py-3">Fim</th>
                        <th scope="col" className="w-40 px-4 py-3">Duração</th>
                        <th scope="col" className="w-64 px-4 py-3">Observações</th>
                        <th scope="col" className="w-40 px-4 py-3">Operador</th>
                        <th scope="col" className="w-24 px-4 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSpoutTracks.map(track => (
                         editingSpoutTrack?.id === track.id ? (
                          <tr key={track.id} className="border-b bg-secondary/50">
                            <td className="px-2 py-2 text-center align-middle"><Checkbox checked={editingSpoutTrack.isOccurrence} onCheckedChange={(checked) => setEditingSpoutTrack(prev => ({...prev, isOccurrence: !!checked}))}/></td>
                            <td className="px-2 py-2"><Input value={editingSpoutTrack.spoutNumber || ''} onChange={(e) => setEditingSpoutTrack(prev => ({...prev, spoutNumber: e.target.value}))} /></td>
                            <td className="px-2 py-2"><Select value={editingSpoutTrack.product || ""} onValueChange={(v) => setEditingSpoutTrack(prev => ({...prev, product: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{PRODUCT_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></td>
                            <td className="px-2 py-2"><Select value={editingSpoutTrack.destination || ""} onValueChange={(v) => setEditingSpoutTrack(prev => ({...prev, destination: v as any, cell: '', belt: '', unloadingPoint: ''}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="TEG">TEG</SelectItem><SelectItem value="TEAG">TEAG</SelectItem></SelectContent></Select></td>
                            <td className="px-2 py-2"><Select value={editingSpoutTrack.unloadingPoint || ""} onValueChange={(v) => setEditingSpoutTrack(prev => ({...prev, unloadingPoint: v}))} disabled={!editingSpoutTrack.destination}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(editingSpoutTrack.destination === 'TEG' ? TEG_UNLOADING_POINTS : TEAG_UNLOADING_POINTS).map(point => <SelectItem key={point} value={point}>{point}</SelectItem>)}</SelectContent></Select></td>
                            <td className="px-2 py-2"><Select value={editingSpoutTrack.cell || ""} onValueChange={(v) => setEditingSpoutTrack(prev => ({...prev, cell: v}))} disabled={!editingSpoutTrack.destination}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(editingSpoutTrack.destination === 'TEG' ? TEG_CELLS : TEAG_CELLS).map(cell => <SelectItem key={cell} value={cell}>{cell}</SelectItem>)}</SelectContent></Select></td>
                            <td className="px-2 py-2"><Select value={editingSpoutTrack.belt || ""} onValueChange={(v) => setEditingSpoutTrack(prev => ({...prev, belt: v}))} disabled={!editingSpoutTrack.destination}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(editingSpoutTrack.destination === 'TEG' ? TEG_BELTS : TEAG_BELTS).map(belt => <SelectItem key={belt} value={belt}>{belt}</SelectItem>)}</SelectContent></Select></td>
                            <td className="px-2 py-2"><Input type="datetime-local" value={`${editingSpoutTrack.spoutStartDate}T${editingSpoutTrack.spoutStartTime}` || ''} onChange={(e) => { const [date, time] = e.target.value.split('T'); setEditingSpoutTrack(prev => ({ ...prev, spoutStartDate: date, spoutStartTime: time })); }} /></td>
                            <td className="px-2 py-2"><Input type="datetime-local" value={`${editingSpoutTrack.spoutEndDate}T${editingSpoutTrack.spoutEndTime}` || ''} onChange={(e) => { const [date, time] = e.target.value.split('T'); setEditingSpoutTrack(prev => ({ ...prev, spoutEndDate: date, spoutEndTime: time })); }} /></td>
                            <td className="px-2 py-2">-</td>
                            <td className="px-2 py-2"><Textarea value={editingSpoutTrack.observations || ''} onChange={(e) => setEditingSpoutTrack(prev => ({...prev, observations: e.target.value}))} /></td>
                            <td className="px-2 py-2"><div className="truncate" title={track.operator}>{track.operator}</div></td>
                            <td className="px-2 py-2 text-center">
                              <div className="flex justify-center gap-1">
                                <Button size="icon" variant="ghost" onClick={handleUpdateSpoutTrack} title="Salvar"><Save className="h-4 w-4 text-green-500" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingSpoutTrack(null)} title="Cancelar"><X className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            </td>
                          </tr>
                         ) : (
                          <tr key={track.id} className={`border-b transition-colors ${track.isOccurrence ? 'bg-yellow-100/50 dark:bg-yellow-900/50 hover:bg-yellow-100/70' : 'hover:bg-secondary/50'}`}>
                            <td className="px-2 py-2 text-center align-middle"><Checkbox checked={track.isOccurrence} onCheckedChange={() => handleToggleOccurrence(track)}/></td>
                            <td className="px-4 py-2">{track.spoutNumber}</td>
                            <td className="px-4 py-2">{track.product}</td>
                            <td className="px-4 py-2">{track.destination}</td>
                            <td className="px-4 py-2">{track.unloadingPoint || "-"}</td>
                            <td className="px-4 py-2">{track.cell}</td>
                            <td className="px-4 py-2">{track.belt || "-"}</td>
                            <td className="px-4 py-2 font-medium whitespace-nowrap text-xs">{new Date(track.startTimestamp).toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-2 font-medium whitespace-nowrap text-xs">{new Date(track.endTimestamp).toLocaleString("pt-BR")}</td>
                            <td className="px-4 py-2"><TimelineBar start={track.startTimestamp} end={track.endTimestamp} min={timelineBounds.min} max={timelineBounds.max} /></td>
                            <td className="px-4 py-2 whitespace-pre-wrap text-xs">{track.observations || "-"}</td>
                            <td className="px-4 py-2"><div className="truncate" title={track.operator}>{track.operator}</div></td>
                            <td className="px-4 py-2 text-center">
                               <div className="flex justify-center gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEditSpoutTrack(track)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteSpoutTrack(track.id)} title="Excluir"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </td>
                          </tr>
                         )
                      ))}
                      {filteredSpoutTracks.length === 0 && (
                        <tr><td colSpan={13} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard spoutTracks={spoutTracks} />
          </TabsContent>

          <TabsContent value="discharge-panel"> {/* Alterado */}
             <div className="mt-6">
                <PainelDeDescargaCCO />
             </div>
          </TabsContent>

          <TabsContent value="radar">
            <div className="bg-card border-2 border-primary rounded-lg p-6 my-6">
              <h2 className="text-xl font-semibold mb-3 text-primary">RADAR - Área Compartilhada</h2>
              <div className="flex gap-2 mb-4">
                <Input id="radar-new-item" placeholder="Adicionar item importante..." value={newRadarInput} onChange={(e) => setNewRadarInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddOrUpdateNote('RADAR', newRadarInput)} />
                <Button onClick={() => handleAddOrUpdateNote('RADAR', newRadarInput)}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {radarNotes.map(note => (
                  <div key={note.id} className="group bg-primary/5 border border-primary/30 p-3 rounded">
                    <p className="text-sm mb-2 whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{note.createdBy} ({note.createdByDepartment}) - {formatDistanceToNow(note.createdAt)}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(note.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
              {CCO_CATEGORIES.map((category) => (
                <div key={category} className="bg-card border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-3">{category}</h2>
                  <div className="flex gap-2 mb-4">
                    <Input id={`new-note-input-${category.replace(/\s+/g, '-')}`} placeholder={`Adicionar em ${category}...`} value={newNoteInputs[category]} onChange={(e) => setNewNoteInputs(prev => ({...prev, [category]: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateNote(category, newNoteInputs[category])}/>
                    <Button onClick={() => handleAddOrUpdateNote(category, newNoteInputs[category])}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {notes.filter(n => n.category === category).map(note => (
                        <div key={note.id} className="group bg-secondary/50 p-3 rounded">
                        {editingNote?.id === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              id={`edit-note-textarea-${note.id}`}
                              value={editingNote.content}
                              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAddOrUpdateNote(category, editingNote.content, note.id)}>Salvar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-3 mb-2">
                              <Checkbox id={`note-checkbox-${note.id}`} checked={note.completed || false} onCheckedChange={() => handleToggle(note)} className="mt-0.5" />
                              <p className={`text-sm flex-1 ${note.completed ? "line-through text-muted-foreground" : ""}`}>{note.content}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(note.createdAt)}</span>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(note)}><Pencil className="h-3 w-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(note.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

        </Tabs>

      </div>
      {currentUser && <PrivateChat currentUser={currentUser} />}
      <Toaster />
    </div>
  );
}
