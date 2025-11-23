"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Note, Category } from "@/types/note"
import { CATEGORIES, ANOTACOES_GERAIS_TITLES } from "@/types/note"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NoteFormProps {
  note?: Note | null
  onSubmit: (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => void
  onCancel?: () => void
}

export function NoteForm({ note, onSubmit, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState<Category | "none">("none")

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setCategory(note.category || "none")
    }
  }, [note])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ title, content, category: category === "none" ? undefined : category })

    // Reset form if not editing
    if (!note) {
      setTitle("")
      setContent("")
      setCategory("none")
    }
  }

  const showTitleOptions = category === "Anotações Gerais"

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{note ? "Editar Anotação" : "Nova Anotação"}</CardTitle>
            <CardDescription>{note ? "Atualize sua anotação" : "Adicione uma nova anotação"}</CardDescription>
          </div>
          {note && onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as Category | "none")}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showTitleOptions ? (
            <div className="space-y-2">
              <Label htmlFor="title">Tipo</Label>
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {ANOTACOES_GERAIS_TITLES.map((titleOption) => (
                    <SelectItem key={titleOption} value={titleOption}>
                      {titleOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Digite o título da anotação"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-secondary/50"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="Digite o conteúdo da sua anotação..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={6}
              className="bg-secondary/50 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {note ? "Atualizar" : "Publicar"}
            </Button>
            {note && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
