
"use client";

import { useState, useEffect } from "react";
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
  toggleNoteCompleted
} from "@/lib/realtime";
import { exportStorageLogsToExcel } from "@/lib/export";
import type { Note, Category } from "@/types/note";
import type { StorageLog } from "@/types/storage";
import type { User } from "@/types/user";
import { RADAR_CATEGORY } from "@/types/note";
import { formatDistanceToNow } from "@/lib/format-date";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserTasks } from "@/components/user-tasks";
import { RadarSummary } from "@/components/RadarSummary";
import { BookOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Download, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveClock } from "@/components/live-clock";
import { useChat } from "@/contexts/chat-context";
import { PrivateChat } from "@/components/private-chat";
import { AnimatedHeader } from "@/components/animated-header";

const CCO_CATEGORIES: Category[] = ["Emails", "Incluir no relatório de balança", "Tarefas pendentes"];

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [newNoteInputs, setNewNoteInputs] = useState<Record<Category, string>>({ Emails: "", "Incluir no relatório de balança": "", "Tarefas pendentes": "" });
  const [newRadarInput, setNewRadarInput] = useState("");
  const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);

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
      listenToStorageLogs(setStorageLogs)
    ];
    return () => unsubscribers.forEach(unsub => unsub());
  }, [currentUser]);

  const handleExport = () => {
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

  const handleLogout = async () => {
    await clearAuthSession();
    router.push("/");
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
            teagRailwayMoega03Operation: "Operação TEAG Ferr. 03",
            teagRailwayMoega04Operation: "Operação TEAG Ferr. 04",
            teagRailwayMoega05Operation: "Operação TEAG Ferr. 05",
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="storage">Controle de Operação e Célula</TabsTrigger>
            <TabsTrigger value="tasks">Minhas Tarefas</TabsTrigger>
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
                                <Select id="teg-railway-moega-01" onValueChange={(v) => handleStorageChange("tegRailwayMoega01", v)} value={storageSelection?.tegRailwayMoega01 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teg-railway-moega-01-operation" onValueChange={(v) => handleStorageChange("tegRailwayMoega01Operation", v)} value={storageSelection?.tegRailwayMoega01Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                              </div>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 02:</label>
                              <div className="flex gap-2">
                                <Select id="teg-railway-moega-02" onValueChange={(v) => handleStorageChange("tegRailwayMoega02", v)} value={storageSelection?.tegRailwayMoega02 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teg-railway-moega-02-operation" onValueChange={(v) => handleStorageChange("tegRailwayMoega02Operation", v)} value={storageSelection?.tegRailwayMoega02Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Lado TEAG</h3>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Rodovia:</label>
                              <Select id="teag-road" onValueChange={(v) => handleStorageChange("teagRoad", v)} value={storageSelection?.teagRoad || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-sm font-medium text-muted-foreground">Ferrovia:</label>
                              <Select id="teag-railway" onValueChange={(v) => handleStorageChange("teagRailway", v)} value={storageSelection?.teagRailway || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Rodovia - Tombador 05:</label>
                            <Select id="teag-road-tombador-05" onValueChange={(v) => handleStorageChange("teagRoadTombador05", v)} value={storageSelection?.teagRoadTombador05 || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 03:</label>
                             <div className="flex gap-2">
                                <Select id="teag-railway-moega-03" onValueChange={(v) => handleStorageChange("teagRailwayMoega03", v)} value={storageSelection?.teagRailwayMoega03 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teag-railway-moega-03-operation" onValueChange={(v) => handleStorageChange("teagRailwayMoega03Operation", v)} value={storageSelection?.teagRailwayMoega03Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 04:</label>
                             <div className="flex gap-2">
                                <Select id="teag-railway-moega-04" onValueChange={(v) => handleStorageChange("teagRailwayMoega04", v)} value={storageSelection?.teagRailwayMoega04 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
                                <Select id="teag-railway-moega-04-operation" onValueChange={(v) => handleStorageChange("teagRailwayMoega04Operation", v)} value={storageSelection?.teagRailwayMoega04Operation || "descarga-vagao"}><SelectTrigger className="w-1/2"><SelectValue placeholder="Operação..." /></SelectTrigger><SelectContent><SelectItem value="descarga-vagao">Descarga Vagão</SelectItem><SelectItem value="descarga-caminhao">Descarga Caminhão</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 05:</label>
                             <div className="flex gap-2">
                                <Select id="teag-railway-moega-05" onValueChange={(v) => handleStorageChange("teagRailwayMoega05", v)} value={storageSelection?.teagRailwayMoega05 || ""}><SelectTrigger className="w-1/2"><SelectValue placeholder="Célula..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem><SelectItem value="parado">Parado</SelectItem></SelectContent></Select>
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
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
                      <span className="text-muted-foreground">até</span>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
                      <Button onClick={handleExport} disabled={storageLogs.length === 0} variant="outline" size="sm" className="gap-2">
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

          <TabsContent value="tasks">
             {currentUser && <UserTasks currentUser={currentUser} />}
          </TabsContent>

          <TabsContent value="radar">
            <div className="bg-card border-2 border-primary rounded-lg p-6 my-6">
              <h2 className="text-xl font-semibold mb-3 text-primary">RADAR - Área Compartilhada</h2>
              <div className="flex gap-2 mb-4">
                <Input placeholder="Adicionar item importante..." value={newRadarInput} onChange={(e) => setNewRadarInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddOrUpdateNote('RADAR', newRadarInput)} />
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
                    <Input placeholder={`Adicionar em ${category}...`} value={newNoteInputs[category]} onChange={(e) => setNewNoteInputs(prev => ({...prev, [category]: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateNote(category, newNoteInputs[category])}/>
                    <Button onClick={() => handleAddOrUpdateNote(category, newNoteInputs[category])}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {notes.filter(n => n.category === category).map(note => (
                        <div key={note.id} className="group bg-secondary/50 p-3 rounded">
                        {editingNote?.id === note.id ? (
                          <div className="space-y-2">
                            <Textarea
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
                              <Checkbox checked={note.completed || false} onCheckedChange={() => handleToggle(note)} className="mt-0.5" />
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
