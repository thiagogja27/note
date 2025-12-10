
import { firebaseAdmin } from '../../../lib/firebase-admin';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Tipagem para o formato esperado de uma anotação do Firebase.
type FirebaseNote = {
  content: string;
  title: string;
  createdBy: string;
  createdAt: string;
  category: string;
  deleted?: boolean;
};

console.log('[CRON JOB] Carregando as variáveis de ambiente...');
const resendApiKey = process.env.RESEND_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const cronSecret = process.env.CRON_SECRET;

// Log para verificar se as chaves estão sendo carregadas
console.log(`[CRON JOB] Resend Key Loaded: ${!!resendApiKey}`);
console.log(`[CRON JOB] Gemini Key Loaded: ${!!geminiApiKey}`);
console.log(`[CRON JOB] Cron Secret Loaded: ${!!cronSecret}`);

// Inicializa o cliente do Resend para envio de e-mails.
if (!resendApiKey) {
  console.error('[CRON JOB] Erro Crítico: A variável de ambiente RESEND_API_KEY não está definida.');
}
const resend = new Resend(resendApiKey);

// Inicializa o cliente da IA Generativa do Google.
if (!geminiApiKey) {
  console.error('[CRON JOB] Erro Crítico: A variável de ambiente GEMINI_API_KEY não está definida.');
}
const genAI = new GoogleGenerativeAI(geminiApiKey as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function GET(request: Request) {
  console.log('\n');
  console.log('===================================================');
  console.log('[CRON JOB] Início da execução em:', new Date().toISOString());

  // Proteção da API: verifica o header de autorização.
  const authHeader = request.headers.get('authorization');
  console.log('[CRON JOB] Verificando autorização...');
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[CRON JOB] Falha na autenticação. Header recebido:', authHeader);
    return new Response('Acesso não autorizado.', { status: 401 });
  }
  console.log('[CRON JOB] Autorização bem-sucedida.');

  try {
    console.log('[CRON JOB] Acessando o banco de dados Firebase Admin...');
    const db = firebaseAdmin.database();
    const notesRef = db.ref('/anotacoes');
    console.log('[CRON JOB] Referência para /anotacoes criada.');

    console.log('[CRON JOB] Buscando anotações (snapshot) do Firebase...');
    const snapshot = await notesRef.once('value');
    const allNotesData = snapshot.val();
    console.log('[CRON JOB] Snapshot recebido do Firebase.');

    if (!allNotesData) {
      console.log('[CRON JOB] Nenhuma anotação encontrada no banco de dados. Encerrando.');
      return NextResponse.json({ message: "Nenhuma anotação encontrada." });
    }
    console.log('[CRON JOB] Anotações encontradas. Iniciando filtragem...');

    const radarNotes = Object.values(allNotesData).filter((note): note is FirebaseNote => {
      const n = note as FirebaseNote;
      return n.category === 'RADAR' && n.deleted !== true;
    });
    console.log(`[CRON JOB] Filtragem concluída. ${radarNotes.length} anotações da categoria RADAR encontradas.`);

    if (radarNotes.length === 0) {
      console.log('[CRON JOB] Nenhuma anotação de RADAR para resumir. Encerrando.');
      return NextResponse.json({ message: "Nenhuma anotação no RADAR encontrada." });
    }

    const formattedNotes = radarNotes
      .map(note => `Título: ${note.title}\nConteúdo: ${note.content}\nAutor: ${note.createdBy}\n---\n`)
      .join('\n');
    console.log('[CRON JOB] Anotações formatadas para a IA.');

    const prompt = `
      Você é um assistente de resumo executivo. Sua tarefa é analisar as seguintes anotações da categoria "RADAR" e criar um resumo claro e conciso em formato de e-mail.
      O público-alvo são os gerentes e supervisores.
      O e-mail deve ter o seguinte formato:
      - Um título geral para o e-mail.
      - Uma breve introdução (uma frase).
      - Uma lista de pontos principais (bullet points) destacando os temas mais importantes ou urgentes.
      - Uma breve conclusão ou próximos passos sugeridos.
      - A saudação final deve ser "Atenciosamente, Automação Anotapp".
      - A língua deve ser Português do Brasil.

      Anotações a serem resumidas:
      ${formattedNotes}
    `;
    console.log('[CRON JOB] Prompt criado. Enviando para a API do Gemini...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const emailContent = response.text();
    console.log('[CRON JOB] Resumo recebido da API do Gemini.');
    console.log('[CRON JOB] Conteúdo do E-mail gerado:\n', emailContent);

    const [subject, ...body] = emailContent.split('\n');
    const emailHtml = body.join('\n').replace(/\n/g, '<br>');
    console.log('[CRON JOB] E-mail formatado para HTML.');
    
    const cleanSubject = subject.replace(/\*?Assunto:\*?\s?/i, '').trim();
    console.log(`[CRON JOB] Assunto do E-mail: ${cleanSubject}`);

    console.log('[CRON JOB] Enviando e-mail de teste para o seu e-mail de cadastro...');
    await resend.emails.send({
      from: 'Anotapp <onboarding@resend.dev>',
      to: ['thiago.viaembratelgja@gmail.com'], // ALTERADO: Destino configurado para o seu e-mail.
      subject: cleanSubject,
      html: emailHtml,
    });
    console.log('[CRON JOB] E-mail enviado com sucesso para thiago.viaembratelgja@gmail.com!');
    console.log('===================================================');


    return NextResponse.json({ message: "Resumo por e-mail enviado com sucesso!" });

  } catch (error: any) {
    console.error('\n');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[CRON JOB] UM ERRO OCORREU DURANTE A EXECUÇÃO');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    if (error.response) {
      console.error('[CRON JOB] Detalhes do Erro de API (Response):', JSON.stringify(error.response, null, 2));
    } else {
      console.error('[CRON JOB] Detalhes do Erro:', error);
      console.error('[CRON JOB] Mensagem do Erro:', error.message);
      console.error('[CRON JOB] Stack Trace:', error.stack);
    }
    console.error('===================================================');
    return NextResponse.json({ message: "Erro interno do servidor." }, { status: 500 });
  }
}
