"use client"

import type React from "react"

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
      // 1. Autentica com o Firebase Auth. A função agora lança um erro detalhado em caso de falha.
      const firebaseUser = await signInWithEmailPassword(email, password)

      // 2. Busca o perfil do usuário no Realtime Database.
      let appUser = await getUser(firebaseUser.uid)

      // 3. Se o perfil não existir, cria um novo com valores padrão.
      if (!appUser) {
        const newUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || "Novo Usuário",
          role: "assistente",
          department: "balanca",
        }
        await saveOrUpdateUser(newUser)
        appUser = await getUser(firebaseUser.uid) // Busca o usuário recém-criado

        if (!appUser) {
          // Este erro só deve acontecer se houver um problema grave com o banco de dados.
          setError("Falha ao criar o perfil do usuário no banco de dados. Contate o suporte.")
          setIsLoading(false)
          return
        }
      }

      // 4. Salva a sessão e executa o login no aplicativo.
      saveAuthSession(firebaseUser, appUser.department)
      onLogin(appUser)
      
    } catch (error: any) {
      // 5. Exibe a mensagem de erro específica vinda do Firebase (ex: "Senha incorreta").
      console.error("[v0] Erro detalhado ao fazer login:", error.message)
      setError(error.message)
      setPassword("")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

          <div className="mt-6 p-3 bg-muted/50 rounded-md border border-border">
            <p className="text-xs text-muted-foreground text-center">
              Usando Firebase Authentication
              <br />
              <br />
              <strong className="text-foreground">Primeiro acesso?</strong>
              <br />
              Crie usuários em:{" "}
              <a
                href="https://console.firebase.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Firebase Console
              </a>
              <br />
              Authentication → Users → Add user
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
