'use client'

import { get, ref, set } from "firebase/database"
import { db } from "./firebase"

export interface Balanca {
  id: string
  usuario: string
  maquina: string
}

const initialData: Balanca[] = [
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

const BALANCAS_PATH = "balancas"

async function seedInitialData() {
  const balancasToSave = {}
  initialData.forEach((balanca) => {
    balancasToSave[balanca.id] = balanca
  })
  await set(ref(db, BALANCAS_PATH), balancasToSave)
  return initialData
}

export async function getBalancas(): Promise<Balanca[]> {
  const balancasRef = ref(db, BALANCAS_PATH)
  const snapshot = await get(balancasRef)
  if (snapshot.exists()) {
    const balancas = snapshot.val()
    return Object.values(balancas)
  } else {
    return await seedInitialData()
  }
}

export async function saveBalancas(balancas: Balanca[]): Promise<void> {
  const balancasRef = ref(db, BALANCAS_PATH)
  const balancasToSave = {}
  balancas.forEach((balanca) => {
    balancasToSave[balanca.id] = balanca
  })
  await set(balancasRef, balancasToSave)
}
