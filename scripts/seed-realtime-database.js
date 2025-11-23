// Script para inicializar o Firebase Realtime Database com dados de exemplo
// Execute este script para criar a estrutura inicial do banco de dados

import { initializeApp } from "firebase/app"
import { getDatabase, ref, set } from "firebase/database"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
}

if (!firebaseConfig.databaseURL) {
  console.error("\n❌ ERRO: NEXT_PUBLIC_FIREBASE_DATABASE_URL não está configurada!")
  console.error("\n📋 Siga estes passos:")
  console.error("1. Acesse o Firebase Console: https://console.firebase.google.com")
  console.error("2. Selecione seu projeto")
  console.error("3. No menu lateral, clique em 'Realtime Database'")
  console.error("4. Clique em 'Criar banco de dados'")
  console.error("5. Escolha uma localização (ex: us-central1)")
  console.error("6. Escolha 'Modo de teste' para começar")
  console.error("7. Copie a URL do banco de dados que aparece no topo da página")
  console.error("8. Adicione a URL nas variáveis de ambiente como NEXT_PUBLIC_FIREBASE_DATABASE_URL")
  console.error("\n💡 Formato da URL:")
  console.error("   US Central: https://seu-projeto-default-rtdb.firebaseio.com")
  console.error("   Outras regiões: https://seu-projeto-default-rtdb.regiao.firebasedatabase.app")
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

const sampleUsers = {
  user1: {
    username: "admin@tegporto.com",
    password: "admin123",
    role: "admin",
    department: "balanca",
  },
  user2: {
    username: "operador@tegporto.com",
    password: "operador123",
    role: "assistente",
    department: "balanca",
  },
  user3: {
    username: "cco@tegporto.com",
    password: "cco123",
    role: "admin",
    department: "cco",
  },
}

const sampleNotes = {
  note1: {
    title: "Verificar emails pendentes",
    content: "Responder email do cliente sobre agendamento de descarga para próxima semana.",
    category: "Emails",
    userId: "user1",
    completed: false,
    createdBy: "admin@tegporto.com",
    createdByDepartment: "balanca",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  note2: {
    title: "Atualizar relatório de balança",
    content: "Incluir dados de pesagem do lote TEG-2024-001 no relatório mensal.",
    category: "Incluir no relatório de balança",
    userId: "user1",
    completed: false,
    createdBy: "admin@tegporto.com",
    createdByDepartment: "balanca",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  note3: {
    title: "Calibração de balança",
    content: "Agendar calibração da balança rodoviária 03 para próxima segunda-feira.",
    category: "Tarefas pendentes",
    userId: "user2",
    completed: false,
    createdBy: "operador@tegporto.com",
    createdByDepartment: "balanca",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  note4: {
    title: "Balança 07 inoperante",
    content:
      "🚨 ATENÇÃO: Balança rodoviária 07 está fora de operação para manutenção preventiva. Previsão de retorno: 15/01/2025.",
    category: "RADAR",
    userId: "user1",
    completed: false,
    createdBy: "admin@tegporto.com",
    createdByDepartment: "balanca",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  note5: {
    title: "Restrição de acesso",
    content: "Área de tombadores 01 e 06 com acesso restrito devido a obras de manutenção até 20/01/2025.",
    category: "RADAR",
    userId: "user3",
    completed: false,
    createdBy: "cco@tegporto.com",
    createdByDepartment: "cco",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

const sampleStorage = {
  current: {
    tegRoad: "A1",
    tegRoadTombador: "B1",
    tegRailwayMoega01: "C1",
    tegRailwayMoega02: "A2",
    teagRoad: "A3",
    teagRailway: "B3",
    updatedBy: "cco@tegporto.com",
    updatedByDepartment: "cco",
    updatedAt: new Date().toISOString(),
  },
}

async function seedRealtimeDatabase() {
  console.log("🚀 Iniciando inicialização do Firebase Realtime Database...")
  console.log(`📍 Database URL: ${firebaseConfig.databaseURL}`)

  try {
    // Criar estrutura de usuários
    console.log("\n1️⃣  Criando usuários...")
    await set(ref(db, "usuarios"), sampleUsers)
    console.log("✅ Usuários criados com sucesso!")
    console.log("   👤 admin@tegporto.com / admin123 (Admin - Balança)")
    console.log("   👤 operador@tegporto.com / operador123 (Assistente - Balança)")
    console.log("   👤 cco@tegporto.com / cco123 (Admin - CCO)")

    // Criar estrutura de anotações
    console.log("\n2️⃣  Criando anotações...")
    await set(ref(db, "anotacoes"), sampleNotes)
    console.log("✅ Anotações criadas com sucesso!")
    console.log(`   📝 ${Object.keys(sampleNotes).length} anotações de exemplo`)
    console.log("   📂 Categorias: Emails, Incluir no relatório de balança, Tarefas pendentes, RADAR")

    // Criar estrutura de estocagem
    console.log("\n3️⃣  Criando células de estocagem...")
    await set(ref(db, "estocagem"), sampleStorage)
    console.log("✅ Células de estocagem criadas com sucesso!")
    console.log("   🏭 TEG: Rodovia (A1, B1), Ferrovia Moega 01 (C1), Moega 02 (A2)")
    console.log("   🏭 TEAG: Rodovia (A3), Ferrovia (B3)")

    console.log("\n" + "=".repeat(60))
    console.log("✅ Firebase Realtime Database inicializado com sucesso!")
    console.log("=".repeat(60))

    console.log("\n📝 Próximos passos:")
    console.log("1. Configure as regras de segurança no Firebase Console")
    console.log("2. Crie os usuários no Firebase Authentication")
    console.log("3. Faça login no aplicativo com as credenciais abaixo")

    console.log("\n🔐 Credenciais de teste:")
    console.log("┌─────────────────────────────────────────────────────┐")
    console.log("│ Admin Balança:                                      │")
    console.log("│   Email: admin@tegporto.com                         │")
    console.log("│   Senha: admin123                                   │")
    console.log("├─────────────────────────────────────────────────────┤")
    console.log("│ Operador Balança:                                   │")
    console.log("│   Email: operador@tegporto.com                      │")
    console.log("│   Senha: operador123                                │")
    console.log("├─────────────────────────────────────────────────────┤")
    console.log("│ Admin CCO:                                          │")
    console.log("│   Email: cco@tegporto.com                           │")
    console.log("│   Senha: cco123                                     │")
    console.log("└─────────────────────────────────────────────────────┘")

    console.log("\n⚠️  IMPORTANTE: Você precisa criar estes usuários no Firebase Authentication!")
    console.log("   1. Acesse: https://console.firebase.google.com")
    console.log("   2. Vá para: Authentication > Users")
    console.log("   3. Clique em 'Add user' e crie cada usuário com email e senha")
  } catch (error) {
    console.error("\n❌ Erro ao inicializar Realtime Database:", error)
    console.error("\n🔍 Possíveis causas:")
    console.error("1. O Firebase Realtime Database não foi criado no console")
    console.error("   → Acesse: https://console.firebase.google.com")
    console.error("   → Vá para: Realtime Database > Criar banco de dados")
    console.error("\n2. A URL do database está incorreta")
    console.error(`   → URL configurada: ${firebaseConfig.databaseURL}`)
    console.error("   → Verifique se a URL corresponde à mostrada no Firebase Console")
    console.error("\n3. As regras de segurança estão muito restritivas")
    console.error("   → Configure temporariamente para modo de teste:")
    console.error('   → { "rules": { ".read": true, ".write": true } }')
    console.error("\n4. As variáveis de ambiente não estão carregadas")
    console.error("   → Certifique-se de ter todas as variáveis configuradas no v0")
    process.exit(1)
  }
}

seedRealtimeDatabase()
