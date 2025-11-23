import { getFirebaseDatabase } from "./firebase"
import { ref, set, get } from "firebase/database"

export async function initializeDatabaseStructure() {
  try {
    const database = getFirebaseDatabase()

    // Check if database is already initialized
    const usersRef = ref(database, "usuarios")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      console.log("[v0] Database already initialized")
      return { success: true, message: "Database already initialized" }
    }

    console.log("[v0] Initializing database structure...")

    // Initialize usuarios
    await set(ref(database, "usuarios"), {
      user1: {
        username: "admin",
        email: "admin@empresa.com",
        role: "Administrador",
        department: "TI",
        createdAt: new Date().toISOString(),
      },
      user2: {
        username: "operador1",
        email: "operador1@empresa.com",
        role: "Operador",
        department: "Produção",
        createdAt: new Date().toISOString(),
      },
      user3: {
        username: "supervisor",
        email: "supervisor@empresa.com",
        role: "Supervisor",
        department: "Qualidade",
        createdAt: new Date().toISOString(),
      },
    })

    // Initialize anotacoes with sample notes
    await set(ref(database, "anotacoes"), {
      note1: {
        id: "note1",
        content: "Verificar emails pendentes do cliente XYZ",
        category: "Emails",
        userId: "user1",
        username: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      note2: {
        id: "note2",
        content: "Incluir dados de produção do turno da manhã",
        category: "Incluir no relatório de balança",
        userId: "user2",
        username: "operador1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      note3: {
        id: "note3",
        content: "Realizar manutenção preventiva na linha 2",
        category: "Tarefas pendentes",
        userId: "user3",
        username: "supervisor",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      note4: {
        id: "note4",
        content: "ATENÇÃO: Problema identificado no setor de embalagem",
        category: "RADAR",
        userId: "user3",
        username: "supervisor",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })

    // Initialize estocagem structure
    const cells = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4"]
    const tegCells: Record<string, boolean> = {}
    const teagCells: Record<string, boolean> = {}

    cells.forEach((cell) => {
      tegCells[cell] = false
      teagCells[cell] = false
    })

    await set(ref(database, "estocagem/current"), {
      teg: tegCells,
      teag: teagCells,
    })

    console.log("[v0] Database structure initialized successfully")
    return { success: true, message: "Database initialized successfully" }
  } catch (error) {
    console.error("[v0] Error initializing database:", error)
    return { success: false, error }
  }
}
