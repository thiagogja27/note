import { initializeApp } from "firebase/app"
import { getDatabase, ref, get } from "firebase/database"

console.log("🔍 Verificando configuração do Firebase...\n")

// Verificar variáveis de ambiente
const requiredEnvVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

console.log("📋 Verificando variáveis de ambiente:")
const missingVars = []
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.log(`❌ ${key}: NÃO CONFIGURADA`)
    missingVars.push(key)
  } else {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
  }
}

if (missingVars.length > 0) {
  console.log("\n❌ ERRO: Variáveis de ambiente faltando!")
  console.log("\n📝 Para configurar:")
  console.log("1. Vá para o Firebase Console: https://console.firebase.google.com")
  console.log("2. Selecione seu projeto")
  console.log('3. Vá em "Realtime Database" no menu lateral')
  console.log('4. Clique em "Criar banco de dados"')
  console.log("5. Escolha uma localização (ex: us-central1)")
  console.log('6. Escolha "Modo de teste" para começar')
  console.log("7. Copie a URL do banco de dados que aparece no topo")
  console.log('8. No v0, clique em "Vars" no sidebar e adicione:')
  console.log("   NEXT_PUBLIC_FIREBASE_DATABASE_URL = [URL copiada]")
  console.log("\n💡 A URL terá um destes formatos:")
  console.log("   • https://PROJECT-ID-default-rtdb.firebaseio.com (US Central)")
  console.log("   • https://PROJECT-ID-default-rtdb.REGION.firebasedatabase.app (outras regiões)")
  process.exit(1)
}

console.log("\n🔗 Tentando conectar ao Firebase Realtime Database...")

try {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  }

  const app = initializeApp(firebaseConfig)
  const database = getDatabase(app)

  console.log("✅ Firebase inicializado com sucesso!")
  console.log(`📍 Database URL: ${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}`)

  // Tentar ler do banco de dados
  console.log("\n🔍 Testando conexão com o banco de dados...")
  const testRef = ref(database, "/")
  const snapshot = await get(testRef)

  if (snapshot.exists()) {
    console.log("✅ Conexão bem-sucedida! Banco de dados já contém dados.")
    console.log("\n📊 Estrutura atual:")
    const data = snapshot.val()
    for (const key of Object.keys(data)) {
      console.log(`   • ${key}`)
    }
    console.log("\n✨ Tudo configurado corretamente!")
  } else {
    console.log("⚠️  Conexão bem-sucedida, mas o banco de dados está vazio.")
    console.log("\n📝 Próximo passo:")
    console.log("Execute o script de inicialização para criar a estrutura:")
    console.log("   scripts/seed-realtime-database.js")
  }
} catch (error) {
  console.log("\n❌ ERRO ao conectar ao Firebase Realtime Database!")
  console.log(`Mensagem: ${error.message}`)

  if (error.message.includes("Service database is not available")) {
    console.log("\n🔧 SOLUÇÃO:")
    console.log("O Firebase Realtime Database não está habilitado no seu projeto.")
    console.log("\nPara habilitar:")
    console.log("1. Acesse: https://console.firebase.google.com")
    console.log("2. Selecione seu projeto")
    console.log('3. No menu lateral, clique em "Realtime Database"')
    console.log('4. Clique no botão "Criar banco de dados"')
    console.log("5. Escolha uma localização (recomendado: us-central1)")
    console.log('6. Selecione "Modo de teste" para começar')
    console.log("7. Após criar, copie a URL que aparece no topo da página")
    console.log("8. Adicione essa URL na variável NEXT_PUBLIC_FIREBASE_DATABASE_URL")
  } else if (error.message.includes("Permission denied")) {
    console.log("\n🔧 SOLUÇÃO:")
    console.log("As regras de segurança do banco de dados estão bloqueando o acesso.")
    console.log("\nPara corrigir:")
    console.log("1. Vá para Firebase Console > Realtime Database > Regras")
    console.log("2. Use estas regras para desenvolvimento:")
    console.log("{")
    console.log('  "rules": {')
    console.log('    ".read": true,')
    console.log('    ".write": true')
    console.log("  }")
    console.log("}")
    console.log("\n⚠️  IMPORTANTE: Estas regras são apenas para desenvolvimento!")
  }

  process.exit(1)
}
