'use client'

import { get, ref, set } from "firebase/database"
import { db } from "./firebase"

export interface Balanca {
  id: string
  usuario: string
  maquina: string
}

const initialData: Balanca[] = [
  { id: "BALANÇA 01", usuario: "PS959976", maquina: "BRGUAR14300W" },
  { id: "BALANÇA 02", usuario: "PS865110", maquina: "BRGUAR13179W" },
  { id: "BALANÇA 07", usuario: "PS288277", maquina: "BRGUAR14290W" },
  { id: "BALANÇA 08", usuario: "-", maquina: "BRGUAR20273W" },
  { id: "BALANÇA 09", usuario: "PS2243666", maquina: "BRGUAR24682W" },
  { id: "BALANÇA 10", usuario: "PS445662", maquina: "BRGUAR24681W" },
  { id: "BALANÇA 03", usuario: "PS808813", maquina: "BRGUAR14298W" },
  { id: "BALANÇA 04", usuario: "-", maquina: "BRGUAR14299V" },
  { id: "BALANÇA 05", usuario: "PS606021", maquina: "BRGUAR14292V" },
  { id: "BALANÇA 06", usuario: "PS471750", maquina: "BRGUAR20260V" },
  { id: "BALANÇA 30C", usuario: "-", maquina: "-" },
  { id: "BALANÇA 40D", usuario: "-", maquina: "-" },
]

const BALANCAS_PATH = "balancas"

async function seedInitialData() {
  const balancasToSave: { [key: string]: Balanca } = {}
  initialData.forEach((balanca) => {
    const balancaId = balanca.id.replace(" ", "")
    balancasToSave[balancaId] = balanca
  })
  await set(ref(db, BALANCAS_PATH), balancasToSave)
  return Object.values(balancasToSave)
}

export async function getBalancas(): Promise<Balanca[]> {
  const balancasRef = ref(db, BALANCAS_PATH)
  const snapshot = await get(balancasRef)
  
  if (snapshot.exists()) {
    const existingBalancas = snapshot.val() as { [key: string]: Balanca }
    let needsUpdate = false

    initialData.forEach(initialItem => {
      const balancaId = initialItem.id.replace(" ", "")
      if (!existingBalancas[balancaId]) {
        existingBalancas[balancaId] = initialItem
        needsUpdate = true
      }
    })

    if (needsUpdate) {
      await set(balancasRef, existingBalancas)
    }

    return Object.values(existingBalancas).sort((a, b) => a.id.localeCompare(b.id));
  } else {
    return await seedInitialData()
  }
}

export async function saveBalancas(balancas: Balanca[]): Promise<void> {
  const balancasRef = ref(db, BALANCAS_PATH)
  const balancasToSave: { [key: string]: Balanca } = {}
  balancas.forEach((balanca) => {
    const balancaId = balanca.id.replace(" ", "")
    balancasToSave[balancaId] = balanca
  })
  await set(balancasRef, balancasToSave)
}
