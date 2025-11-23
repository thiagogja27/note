"use client"

import { useState, useEffect } from "react"
import { listenToAnnotations, addAnnotation, updateAnnotation, deleteAnnotation } from "@/lib/annotations"
import type { Annotation, AnnotationType } from "@/types/annotation"
import type { User } from "@/types/user"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, LinkIcon, AlertCircle, FileText, Info } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "@/lib/format-date"

interface AnnotationsManagerProps {
  currentUser: User
}

const ANNOTATION_TYPES: { value: AnnotationType; label: string; icon: any }[] = [
  { value: "parada", label: "Parada", icon: AlertCircle },
  { value: "link", label: "Link", icon: LinkIcon },
  { value: "observacao", label: "Observação", icon: FileText },
  { value: "geral", label: "Geral", icon: Info },
]

const TYPE_COLORS = {
  parada: "bg-red-500/10 text-red-600 border-red-500/30",
  link: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  observacao: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  geral: "bg-gray-500/10 text-gray-600 border-gray-500/30",
}

export function AnnotationsManager({ currentUser }: AnnotationsManagerProps) {
  const { toast } = useToast()
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null)
  const [filterType, setFilterType] = useState<AnnotationType | "all">("all")

  // Form state
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formType, setFormType] = useState<AnnotationType>("geral")
  const [formUrl, setFormUrl] = useState("")

  useEffect(() => {
    console.log("[v0] AnnotationsManager montado, iniciando listener...")
    
    const unsubscribe = listenToAnnotations((fetchedAnnotations) => {
      console.log(`[v0] AnnotationsManager recebeu ${fetchedAnnotations.length} anotações`)
      setAnnotations(fetchedAnnotations)
    })

    return () => unsubscribe()
  }, [])

  const resetForm = () => {
    setFormTitle("")
    setFormContent("")
    setFormType("geral")
    setFormUrl("")
    setEditingAnnotation(null)
  }

  const handleOpenDialog = (annotation?: Annotation) => {
    if (annotation) {
      setEditingAnnotation(annotation)
      setFormTitle(annotation.title)
      setFormContent(annotation.content)
      setFormType(annotation.type)
      setFormUrl(annotation.url || "")
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo",
        variant: "destructive",
      })
      return
    }

    if (formType === "link" && !formUrl.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Para anotações do tipo Link, a URL é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingAnnotation) {
        await updateAnnotation(
          editingAnnotation.id,
          {
            title: formTitle,
            content: formContent,
            type: formType,
            url: formType === "link" ? formUrl : undefined,
          },
          currentUser.username,
          currentUser.department,
        )
        toast({
          title: "Atualizado!",
          description: "Anotação atualizada com sucesso",
        })
      } else {
        await addAnnotation({
          title: formTitle,
          content: formContent,
          type: formType,
          url: formType === "link" ? formUrl : undefined,
          createdBy: currentUser.username,
          createdByDepartment: currentUser.department,
        })
        toast({
          title: "Criado!",
          description: "Anotação criada com sucesso",
        })
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anotação",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta anotação?")) return

    try {
      await deleteAnnotation(id)
      toast({
        title: "Excluído",
        description: "Anotação removida com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a anotação",
        variant: "destructive",
      })
    }
  }

  const filteredAnnotations = annotations.filter((annotation) => {
    if (filterType !== "all" && annotation.type !== filterType) return false
    return true
  })

  const getTypeIcon = (type: AnnotationType) => {
    const typeConfig = ANNOTATION_TYPES.find((t) => t.value === type)
    const Icon = typeConfig?.icon || Info
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Anotações Gerais</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie paradas, links, observações e informações importantes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Anotação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAnnotation ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as AnnotationType)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNOTATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Manutenção programada, Link útil, etc."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  placeholder="Descreva os detalhes da anotação..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={4}
                />
              </div>

              {formType === "link" && (
                <div className="space-y-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://exemplo.com"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  {editingAnnotation ? "Atualizar" : "Criar"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Select value={filterType} onValueChange={(v) => setFilterType(v as AnnotationType | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {ANNOTATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredAnnotations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma anotação encontrada</p>
        ) : (
          filteredAnnotations.map((annotation) => (
            <div
              key={annotation.id}
              className="group bg-secondary/30 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded border text-xs flex items-center gap-1 ${TYPE_COLORS[annotation.type]}`}
                    >
                      {getTypeIcon(annotation.type)}
                      {ANNOTATION_TYPES.find((t) => t.value === annotation.type)?.label}
                    </span>
                    <h3 className="font-semibold">{annotation.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{annotation.content}</p>
                  {annotation.url && (
                    <a
                      href={annotation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {annotation.url}
                    </a>
                  )}
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                    <span>{formatDistanceToNow(annotation.updatedAt)}</span>
                    <span className="text-primary font-medium">
                      Criado por: {annotation.createdBy} ({annotation.createdByDepartment?.toUpperCase()})
                    </span>
                    {annotation.updatedBy && annotation.updatedBy !== annotation.createdBy && (
                      <span className="text-orange-500 font-medium">
                        Editado por: {annotation.updatedBy} ({annotation.updatedByDepartment?.toUpperCase()})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(annotation)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(annotation.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
