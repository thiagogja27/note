import { BookOpen } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <div className="p-4 bg-primary/20 rounded-lg">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="relative p-4 bg-primary/10 rounded-lg border border-primary/20">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        <p className="text-muted-foreground animate-pulse">Carregando anotações...</p>
      </div>
    </div>
  )
}
