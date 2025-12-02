"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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
import type { StorageSelection, StorageLog } from "@/types/storage";
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
import { BookOpen, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Download } from "lucide-react";

const CCO_CATEGORIES: Category[] = ["Emails", "Incluir no relatório de balança", "Tarefas pendentes"];

export default function CCOPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEstocagem, setShowEstocagem] = useState(true);
  const [showTarefas, setShowTarefas] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [radarNotes, setRadarNotes] = useState<Note[]>([]);
  const [storageSelection, setStorageSelection] = useState<StorageSelection | null>(null);
  const [storageLogs, setStorageLogs] = useState<StorageLog[]>([]);

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
    const today = new Date().toISOString().split('T')[0];
    exportStorageLogsToExcel(storageLogs, `historico_estocagem_${today}`);
    toast({ title: "Exportação Concluída" });
  };

  const handleLogout = async () => {
    await clearAuthSession();
    router.push("/");
  };

  const handleStorageChange = async (field: keyof Omit<StorageSelection, 'id' | 'updatedAt' | 'updatedBy' | 'updatedByDepartment'>, value: string) => {
    if (!currentUser || !storageSelection) return;
    const newSelection = { ...storageSelection, [field]: value };
    await saveStorageSelection({ ...newSelection, updatedBy: currentUser.username, updatedByDepartment: currentUser.department });
    const fieldNames: Record<string, string> = { tegRoad: "TEG Rod. 01/06", tegRoadTombador: "TEG Rod. 07", tegRailwayMoega01: "TEG Ferr. 01", tegRailwayMoega02: "TEG Ferr. 02", teagRoad: "TEAG Rodovia", teagRailway: "TEAG Ferrovia" };
    const alertMessage = `🚨 ALTERAÇÃO DE CÉLULA: ${fieldNames[field]} alterada para ${value}`;
    await addNote({ title: alertMessage, content: alertMessage, category: RADAR_CATEGORY, userId: currentUser.id, createdBy: currentUser.username, createdByDepartment: currentUser.department });
    toast({ title: "Estocagem Atualizada", description: `${fieldNames[field]} foi definida como ${value}.` });
  };
  
  const formatChanges = (changes: StorageLog['changes']) => {
    return Object.entries(changes).filter(([, value]) => value).map(([key, value]) => `${key.replace('teg', 'TEG ').replace('teag', 'TEAG ').replace('Road', 'Rod.').replace('Railway', 'Ferr.').replace('Moega', 'M.')}: ${value}`).join(" | ") || "N/A";
  };
  
  // Função unificada para adicionar ou atualizar notas (CCO e RADAR)
  const handleAddOrUpdateNote = async (category: Category | 'RADAR', content: string, id?: string) => {
    if (!content.trim() || !currentUser) return;

    try {
      if (id) {
        // Atualiza a nota existente
        await updateNote(id, { content }, currentUser.username, currentUser.department);
        toast({ title: "Item atualizado!" });
      } else {
        // Adiciona uma nova nota
        await addNote({ title: content.substring(0,30), content, category, userId: currentUser.id, createdBy: currentUser.username, createdByDepartment: currentUser.department });
        toast({ title: `Adicionado em ${category}!` });
      }
      // Limpa os campos de input correspondentes
      if (category === 'RADAR') setNewRadarInput("");
      else setNewNoteInputs(prev => ({ ...prev, [category]: "" }));
      setEditingNote(null); // Sai do modo de edição
    } catch (error) {
      toast({ title: "Erro ao salvar item", variant: "destructive" });
    }
  };

  // CORREÇÃO: Função de apagar agora passa os dados do usuário
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">CCO - Centro de Controle Operacional</h1>
            <p className="text-sm text-muted-foreground">Usuário: {currentUser.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>Sair</Button>
          </div>
        </header>

        <div className="flex gap-4 mb-6">
            <Button variant={showEstocagem ? "default" : "outline"} onClick={() => setShowEstocagem(!showEstocagem)} className="flex-1">CONTROLE DE ESTOCAGEM</Button>
            <Button variant={showTarefas ? "default" : "outline"} onClick={() => setShowTarefas(!showTarefas)} className="flex-1">MINHAS TAREFAS</Button>
        </div>

        {showEstocagem && (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Definir Células de Estocagem</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Lado TEG</h3>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Rodovia - Tombadores 01 e 06:</label>
                            <Select onValueChange={(v) => handleStorageChange("tegRoad", v)} value={storageSelection?.tegRoad || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Rodovia - Tombador 07:</label>
                            <Select onValueChange={(v) => handleStorageChange("tegRoadTombador", v)} value={storageSelection?.tegRoadTombador || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 01:</label>
                            <Select onValueChange={(v) => handleStorageChange("tegRailwayMoega01", v)} value={storageSelection?.tegRailwayMoega01 || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia - Moega 02:</label>
                            <Select onValueChange={(v) => handleStorageChange("tegRailwayMoega02", v)} value={storageSelection?.tegRailwayMoega02 || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A1">A1</SelectItem><SelectItem value="B1">B1</SelectItem><SelectItem value="C1">C1</SelectItem><SelectItem value="A2">A2</SelectItem><SelectItem value="B2">B2</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Lado TEAG</h3>
                        <div className="space-y-1.5">
                           <label className="text-sm font-medium text-muted-foreground">Rodovia:</label>
                           <Select onValueChange={(v) => handleStorageChange("teagRoad", v)} value={storageSelection?.teagRoad || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-muted-foreground">Ferrovia:</label>
                            <Select onValueChange={(v) => handleStorageChange("teagRailway", v)} value={storageSelection?.teagRailway || ""}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="A3">A3</SelectItem><SelectItem value="B3">B3</SelectItem><SelectItem value="A4">A4</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary">Histórico de Alterações de Estocagem</h2>
                <Button onClick={handleExport} disabled={storageLogs.length === 0} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar para Excel
                </Button>
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
        )}

        {showTarefas && currentUser && <UserTasks currentUser={currentUser} />}
        
        <div className="my-6">
            <RadarSummary radarNotes={radarNotes} />
        </div>

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
                  {/* Botões de editar/apagar no RADAR permanecem como estavam */}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(note.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                      // MODO DE EDIÇÃO
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
                      // MODO DE VISUALIZAÇÃO
                      <>
                        <div className="flex items-start gap-3 mb-2">
                          <Checkbox checked={note.completed || false} onCheckedChange={() => handleToggle(note)} className="mt-0.5" />
                          <p className={`text-sm flex-1 ${note.completed ? "line-through text-muted-foreground" : ""}`}>{note.content}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(note.createdAt)}</span>
                          {/* CORREÇÃO: Botões de Editar e Apagar adicionados */}
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

      </div>
      <Toaster />
    </div>
  );
}