"use client"

export function getFirebaseConfig() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  };

  // Verifica se todas as variáveis de ambiente necessárias estão definidas
  for (const [key, value] of Object.entries(firebaseConfig)) {
    if (!value) {
      // No lado do cliente, process.env é avaliado no momento da compilação, 
      // então este erro pode não ser lançado em tempo de execução no navegador, 
      // mas é útil para depuração e durante o build.
      console.error(`Variável de ambiente do Firebase ausente: ${key}`);
      // Não lance um erro que travaria o app, apenas logue.
    }
  }

  return firebaseConfig;
}
