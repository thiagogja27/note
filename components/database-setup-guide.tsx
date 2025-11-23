"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink, CheckCircle } from "lucide-react"

export function DatabaseSetupGuide() {
  const databaseUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold">Firebase Realtime Database não está disponível</AlertTitle>
          <AlertDescription className="mt-2">
            O serviço Firebase Realtime Database não está habilitado ou configurado corretamente.
          </AlertDescription>
        </Alert>

        <Alert className="bg-blue-500/10 border-blue-500/30">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          <AlertTitle className="text-blue-500">As tabelas serão criadas automaticamente!</AlertTitle>
          <AlertDescription className="mt-2 text-foreground">
            Você não precisa criar nenhuma estrutura manualmente no Realtime Database. Após habilitar o serviço e
            configurar a URL, o script de inicialização criará automaticamente todas as tabelas e dados necessários
            (usuários, anotações, RADAR, estocagem).
          </AlertDescription>
        </Alert>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Configuração Necessária</h2>
            <p className="text-muted-foreground mb-4">
              Siga estes 4 passos simples para configurar o Firebase Realtime Database. A estrutura do banco de dados
              será criada automaticamente no passo 4.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                  1
                </span>
                Habilitar Firebase Realtime Database
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-8">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Firebase Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Selecione seu projeto: {projectId || "(projeto não identificado)"}</li>
                <li>No menu lateral, clique em "Realtime Database"</li>
                <li>Clique em "Criar banco de dados"</li>
                <li>
                  Escolha a localização (recomendado: <strong>us-central1</strong> para melhor compatibilidade)
                </li>
                <li>
                  Escolha o modo de segurança: <strong>Modo de teste</strong> (para desenvolvimento)
                </li>
              </ol>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                  2
                </span>
                Copiar a URL do Banco de Dados
              </h3>
              <p className="text-sm text-muted-foreground ml-8 mb-2">
                Após criar o banco de dados, você verá a URL no topo da página do Realtime Database. A URL terá um dos
                seguintes formatos:
              </p>
              <div className="ml-8 space-y-2">
                <div className="bg-secondary/50 rounded p-2 font-mono text-xs">https://SEU-PROJETO.firebaseio.com</div>
                <div className="bg-secondary/50 rounded p-2 font-mono text-xs">
                  https://SEU-PROJETO.REGIAO.firebasedatabase.app
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                  3
                </span>
                Adicionar a URL como Variável de Ambiente
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-8">
                <li>No v0, clique no ícone de menu lateral (☰) no canto superior esquerdo</li>
                <li>Selecione "Vars" (Variáveis de Ambiente)</li>
                <li>
                  Adicione uma nova variável:
                  <div className="mt-2 space-y-1">
                    <div className="bg-secondary/50 rounded p-2">
                      <strong>Nome:</strong> <code className="font-mono">NEXT_PUBLIC_FIREBASE_DATABASE_URL</code>
                    </div>
                    <div className="bg-secondary/50 rounded p-2">
                      <strong>Valor:</strong> <span className="text-muted-foreground">(cole a URL copiada)</span>
                    </div>
                  </div>
                </li>
                <li>Salve a variável</li>
              </ol>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                  4
                </span>
                Executar o Script de Inicialização (Cria as Tabelas Automaticamente)
              </h3>
              <p className="text-sm text-muted-foreground ml-8 mb-2">
                Após configurar a URL, execute o script de inicialização.{" "}
                <strong>Este script criará automaticamente</strong> toda a estrutura do banco de dados:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-12 mb-3">
                <li>Tabela de usuários com 3 usuários de teste (Admin, CCO, Operador)</li>
                <li>Tabela de anotações com exemplos</li>
                <li>Tabela RADAR para notas compartilhadas</li>
                <li>Tabela de estocagem com células configuradas</li>
              </ul>
              <div className="ml-8 bg-secondary/50 rounded p-2 font-mono text-xs">
                scripts/seed-realtime-database.js
              </div>
              <p className="text-xs text-muted-foreground ml-8 mt-2">
                ✓ Clique no botão "Run" ao lado do script para executá-lo
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="font-semibold mb-2">Status Atual da Configuração:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${databaseUrl ? "bg-green-500" : "bg-red-500"}`} />
                <span>
                  URL do Database: {databaseUrl ? <code className="text-xs">{databaseUrl}</code> : "Não configurada"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${projectId ? "bg-green-500" : "bg-red-500"}`} />
                <span>Project ID: {projectId || "Não configurado"}</span>
              </div>
            </div>
          </div>

          <Button onClick={() => window.location.reload()} className="w-full">
            Recarregar Página Após Configuração
          </Button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm">
            <strong>Importante:</strong> Você NÃO precisa criar nenhuma estrutura manualmente no Firebase Console. O
            banco de dados pode estar completamente vazio - o script de inicialização criará tudo automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
