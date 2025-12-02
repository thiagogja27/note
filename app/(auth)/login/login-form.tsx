'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { signInWithEmailPassword, convertToAppUser, saveAuthSession } from "@/lib/firebase-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Department } from "@/types/user"

export function LoginForm() {
  const { setCurrentUser } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [department, setDepartment] = useState<Department>("balanca")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      setError("Por favor, preencha o email e a senha.")
      return
    }

    try {
      const firebaseUser = await signInWithEmailPassword(email, password)
      const appUser = convertToAppUser(firebaseUser, department)

      setCurrentUser(appUser)
      saveAuthSession(firebaseUser, department)

      router.push("/")
    } catch (err: unknown) {
      // CORREÇÃO: Exibe a mensagem de erro vinda da API.
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.")
      }
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Setor</Label>
        <Select name="department" value={department} onValueChange={(value) => setDepartment(value as Department)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balanca">Balança</SelectItem>
            <SelectItem value="cco">CCO</SelectItem>
            <SelectItem value="operacao">Operação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full">Entrar</Button>
    </form>
  )
}
