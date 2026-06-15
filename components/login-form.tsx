"use client"

import type React from "react"
import Image from "next/image";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, LogIn } from "lucide-react"
import { signInWithEmailPassword, saveAuthSession } from "@/lib/firebase-auth"
import { getUser, saveOrUpdateUser } from "@/lib/realtime"
import type { User } from "@/types/user"
import { ThemeToggle } from "@/components/theme-toggle"

interface LoginFormProps {
  onLogin: (user: User) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Digite o email")
      return
    }

    if (!password) {
      setError("Digite a senha")
      return
    }

    setIsLoading(true)

    try {
      const firebaseUser = await signInWithEmailPassword(email, password)
      let appUser = await getUser(firebaseUser.uid)

      if (!appUser) {
        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || "Novo Usuário",
          role: "assistente",
          department: "balanca",
        }
        await saveOrUpdateUser(newUser)
        appUser = await getUser(firebaseUser.uid)

        if (!appUser) {
          setError("Falha ao criar o perfil do usuário no banco de dados. Contate o suporte.")
          setIsLoading(false)
          return
        }
      }

      saveAuthSession(firebaseUser, appUser.department)
      onLogin(appUser)
      
    } catch (error: any) {
      console.error("[v0] Erro detalhado ao fazer login:", error.message)
      setError(error.message)
      setPassword("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-5 left-5">
        <Image
          src="/baltech-logo.png"
          alt="Baltech Logo"
          width={130} 
          height={130}
        />
      </div>
      <div className="absolute top-5 right-5">
        <Image
          src="/teag-logo.png"
          alt="TEAG Logo"
          width={130}
          height={130}
        />
      </div>
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-center">Controle de Tarefas</h1>
            <p className="text-sm text-muted-foreground text-center mt-1">Balança TEG/TEAG</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={error ? "border-destructive" : ""}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={error ? "border-destructive" : ""}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              <LogIn className="h-4 w-4" />
              {isLoading ? "Validando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>
       <footer className="absolute bottom-5 text-center text-sm text-muted-foreground w-full">
          © {new Date().getFullYear()} BalTech. Todos os direitos reservados.
        </footer>
    </div>
  )
}
