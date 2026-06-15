'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getBalancas, saveBalancas } from "@/lib/balancas"
import type { Balanca } from "@/lib/balancas"

export function InformacoesBalancasTable() {
  const [data, setData] = useState<Balanca[]>([])
  const [originalData, setOriginalData] = useState<Balanca[]>([])
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      const balancas = await getBalancas()
      setData(balancas)
      setOriginalData(JSON.parse(JSON.stringify(balancas)))
    }
    fetchData()
  }, [])

  const handleInputChange = (index, field, value) => {
    const newData = [...data]
    newData[index][field] = value
    setData(newData)
  }

  const handleSave = async () => {
    try {
      await saveBalancas(data)
      setOriginalData(JSON.parse(JSON.stringify(data)))
      toast({
        title: "Informações Salvas!",
        description: "As alterações na tabela foram guardadas.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar!",
        description: "Ocorreu um erro ao salvar as informações.",
        variant: "destructive",
      })
    }
  }

  const handleReset = () => {
    setData(JSON.parse(JSON.stringify(originalData)))
    toast({
      title: "Alterações descartadas.",
      variant: "destructive",
    })
  }

  const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData)

  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Informações das Balanças</h2>
          <p className="text-sm text-muted-foreground">Tabela com informações editáveis sobre as balanças.</p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">Salvar Alterações</Button>
            <Button onClick={handleReset} variant="outline" size="sm">Cancelar</Button>
          </div>
        )}
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Nº BALANÇAS</TableHead>
              <TableHead>USUÁRIO</TableHead>
              <TableHead>MÁQUINA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.id}</TableCell>
                <TableCell>
                  <Input
                    value={row.usuario}
                    onChange={(e) => handleInputChange(index, "usuario", e.target.value)}
                    className="border-transparent hover:border-border focus:border-primary transition-colors bg-transparent"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.maquina}
                    onChange={(e) => handleInputChange(index, "maquina", e.target.value)}
                    className="border-transparent hover:border-border focus:border-primary transition-colors bg-transparent"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
