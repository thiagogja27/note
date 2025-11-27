
"use client"

import { useState } from "react"
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
import { useToast } from "@/hooks/use-toast"

const initialData = [
  { id: "BALANÇA01", usuario: "PS959976", maquina: "BRGUAR14300W" },
  { id: "BALANÇA02", usuario: "PS865110", maquina: "BRGUAR13179W" },
  { id: "BALANÇA07", usuario: "PS288277", maquina: "BRGUAR14290W" },
  { id: "BALANÇA08", usuario: "-", maquina: "BRGUAR20273W" },
  { id: "BALANÇA09", usuario: "PS2243666", maquina: "BRGUAR24682W" },
  { id: "BALANÇA10", usuario: "PS445662", maquina: "BRGUAR24681W" },
  { id: "BALANÇA03", usuario: "PS808813", maquina: "BRGUAR14298W" },
  { id: "BALANÇA04", usuario: "-", maquina: "BRGUAR14299V" },
  { id: "BALANÇA05", usuario: "PS606021", maquina: "BRGUAR14292V" },
  { id: "BALANÇA06", usuario: "PS471750", maquina: "BRGUAR20260V" },
]

export function InformacoesBalancasTable() {
  const [data, setData] = useState(initialData)
  const [originalData, setOriginalData] = useState(JSON.parse(JSON.stringify(initialData)))
  const { toast } = useToast()

  const handleInputChange = (index, field, value) => {
    const newData = [...data]
    newData[index][field] = value
    setData(newData)
  }

  const handleSave = () => {
    // Por agora, salva as alterações localmente.
    // No futuro, podemos integrar com o Firebase aqui.
    setOriginalData(JSON.parse(JSON.stringify(data)))
    toast({
      title: "Informações Salvas!",
      description: "As alterações na tabela foram guardadas.",
    })
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
