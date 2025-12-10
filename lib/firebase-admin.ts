
import admin from 'firebase-admin';

// Garante que o app do Firebase Admin não seja inicializado mais de uma vez.
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Substitui caracteres de escape \n por novas linhas reais na chave privada.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      // A URL do seu banco de dados Realtime, vinda das variáveis de ambiente.
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error: any) {
    console.error('Erro na inicialização do Firebase Admin:', error.stack);
  }
}

// Exporta a instância inicializada do admin e o tipo de token decodificado.
export const firebaseAdmin = admin;
export type DecodedIdToken = admin.auth.DecodedIdToken;
