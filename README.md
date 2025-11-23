# App de Anotações com Firebase Realtime Database

Um aplicativo moderno e elegante para gerenciar suas anotações em tempo real, construído com Next.js 15, Firebase Realtime Database e Tailwind CSS.

## Funcionalidades

- ✨ **Atualizações em Tempo Real** - Todas as mudanças são sincronizadas instantaneamente entre usuários
- 📝 Criar, editar e excluir anotações
- 🏷️ Organizar anotações por categorias
- 🔍 Busca em tempo real por título, conteúdo ou categoria
- 📡 Sistema RADAR para notas compartilhadas
- 📦 Gerenciamento de células de estocagem
- 👥 Sistema de usuários com diferentes níveis de acesso
- 🎨 Interface moderna com tema escuro
- 📱 Design responsivo para mobile e desktop

## Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **Firebase Realtime Database** - Banco de dados NoSQL com sincronização em tempo real
- **Tailwind CSS v4** - Estilização moderna
- **shadcn/ui** - Componentes de UI
- **TypeScript** - Tipagem estática
- **date-fns** - Formatação de datas em português

## Configuração do Projeto

### 1. Configurar Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com)
2. Clique em "Adicionar projeto" e siga as instruções
3. Após criar o projeto, clique em "Web" (ícone `</>`) para adicionar um app web
4. Copie as credenciais de configuração

### 2. Ativar Firebase Authentication

⚠️ **IMPORTANTE**: O Firebase Authentication precisa ser habilitado para o login funcionar.

**Passo a passo:**

1. No menu lateral do Firebase Console, vá em **"Authentication"**
2. Clique em **"Começar"**
3. Na aba **"Sign-in method"**, habilite **"Email/Password"**
4. Clique em **"Salvar"**

### 3. Ativar o Realtime Database

⚠️ **IMPORTANTE**: O Firebase Realtime Database precisa ser habilitado manualmente no console.

**Passo a passo detalhado:**

1. No menu lateral do Firebase Console, vá em **"Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha a localização do servidor:
   - **us-central1** (Estados Unidos) - Recomendado para melhor compatibilidade
   - Ou escolha a região mais próxima de você
4. Selecione **"Iniciar no modo de teste"** (para desenvolvimento)
5. Clique em **"Ativar"**
6. **COPIE A URL DO BANCO DE DADOS** que aparece no topo da página

**Formato da URL do banco de dados:**
- Para **us-central1**: `https://seu-projeto-default-rtdb.firebaseio.com`
- Para **outras regiões**: `https://seu-projeto-default-rtdb.regiao.firebasedatabase.app`

### 4. Configurar Regras de Segurança

No Firebase Console, vá em "Realtime Database" > "Regras" e configure:

\`\`\`json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
\`\`\`

⚠️ **Atenção**: Estas regras são para desenvolvimento. Para produção, implemente autenticação adequada.

### 5. Configurar Variáveis de Ambiente

As variáveis de ambiente já estão configuradas no projeto v0. Verifique se os seguintes valores estão corretos na seção **Vars** do sidebar:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- **`NEXT_PUBLIC_FIREBASE_DATABASE_URL`** ⭐ **OBRIGATÓRIO** - Cole a URL copiada no passo 3.6

**Como adicionar a URL do banco de dados:**
1. Clique em **"Vars"** no sidebar do v0
2. Clique em **"Add Variable"**
3. Nome: `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
4. Valor: Cole a URL do seu Realtime Database (ex: `https://seu-projeto-default-rtdb.firebaseio.com`)
5. Clique em **"Save"**

### 6. Verificar Configuração

Antes de inicializar o banco de dados, execute o script de verificação para garantir que tudo está configurado corretamente:

\`\`\`bash
scripts/verify-firebase-setup.js
\`\`\`

Este script irá:
- ✅ Verificar se todas as variáveis de ambiente estão configuradas
- ✅ Testar a conexão com o Firebase Realtime Database
- ✅ Mostrar a estrutura atual do banco de dados (se houver)
- ❌ Indicar o que está faltando e como corrigir

### 7. Inicializar o Banco de Dados

Após verificar que tudo está configurado, execute o script de inicialização:

\`\`\`bash
scripts/seed-realtime-database.js
\`\`\`

O script criará automaticamente:
- 👥 **3 usuários de teste** com diferentes níveis de acesso
- 📝 **5 anotações de exemplo** incluindo notas RADAR
- 📦 **Configuração inicial das células de estocagem** (TEG e TEAG)

**Estrutura criada automaticamente:**
- `usuarios/` - Dados dos usuários (username, role, department)
- `anotacoes/` - Anotações com categorias (Emails, Relatório, Tarefas, RADAR)
- `estocagem/current/` - Células de estocagem selecionadas

### 8. Criar Usuários no Firebase Authentication

⚠️ **IMPORTANTE**: Após executar o seed script, você precisa criar os usuários no Firebase Authentication para poder fazer login.

**Passo a passo:**

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Vá em **"Authentication"** > **"Users"**
3. Clique em **"Add user"**
4. Crie cada usuário com os seguintes dados:

**Usuário 1 - Admin Balança:**
- Email: `admin@tegporto.com`
- Senha: `admin123`

**Usuário 2 - Operador Balança:**
- Email: `operador@tegporto.com`
- Senha: `operador123`

**Usuário 3 - Admin CCO:**
- Email: `cco@tegporto.com`
- Senha: `cco123`

5. Após criar os usuários, você poderá fazer login no aplicativo

## Estrutura do Projeto

\`\`\`
├── app/
│   ├── page.tsx              # Página principal com lista de anotações
│   ├── layout.tsx            # Layout raiz com tema escuro
│   ├── loading.tsx           # Estado de carregamento
│   └── globals.css           # Estilos globais e tema
├── components/
│   ├── note-card.tsx         # Card individual de anotação
│   ├── note-form.tsx         # Formulário para criar/editar
│   └── ui/                   # Componentes shadcn/ui
├── lib/
│   ├── firebase.ts           # Configuração do Firebase
│   ├── realtime.ts           # Funções de tempo real
│   └── storage.ts            # Gerenciamento de estocagem
├── scripts/
│   ├── seed-realtime-database.js  # Script de inicialização
│   └── verify-firebase-setup.js  # Script de verificação
└── types/
    ├── note.ts               # Tipos de anotações
    ├── user.ts               # Tipos de usuários
    └── storage.ts            # Tipos de estocagem
\`\`\`

## Como Usar

### Sistema de Anotações

**Criar uma Anotação:**
1. Clique no botão "Nova Anotação"
2. Preencha o título, categoria e conteúdo
3. Clique em "Adicionar"
4. A anotação aparecerá instantaneamente para todos os usuários conectados

**Editar uma Anotação:**
1. Clique no ícone de lápis na anotação
2. Faça as alterações desejadas
3. Clique em "Atualizar"
4. As mudanças são sincronizadas em tempo real

**Excluir uma Anotação:**
1. Clique no ícone de lixeira
2. Confirme a exclusão
3. A remoção é refletida instantaneamente

### Sistema RADAR

O RADAR é um sistema de notas compartilhadas visíveis para todos os usuários:
- Crie anotações com categoria "RADAR"
- Todas as notas RADAR aparecem em uma seção dedicada
- Ideal para comunicações importantes e alertas

### Gerenciamento de Estocagem

Configure as células de estocagem para diferentes tipos de produtos:
- TEG Rodoviário
- TEG Rodoviário Tombador
- TEG Ferroviário Moega 01/02
- TEAG Rodoviário
- TEAG Ferroviário

## Estrutura de Dados no Realtime Database

\`\`\`
firebase-realtime-db/
├── anotacoes/
│   └── {noteId}/
│       ├── title: string
│       ├── content: string
│       ├── category: string
│       ├── userId: string
│       ├── completed: boolean
│       ├── createdBy: string
│       ├── createdByDepartment: string
│       ├── updatedBy?: string
│       ├── updatedByDepartment?: string
│       ├── createdAt: ISO string
│       └── updatedAt: ISO string
├── usuarios/
│   └── {userId}/
│       ├── username: string
│       ├── password: string
│       ├── role: "admin" | "operator" | "viewer"
│       └── department: string
└── estocagem/
    └── current/
        ├── tegRoad: string
        ├── tegRoadTombador: string
        ├── tegRailwayMoega01: string
        ├── tegRailwayMoega02: string
        ├── teagRoad: string
        ├── teagRailway: string
        ├── updatedBy: string
        ├── updatedByDepartment: string
        └── updatedAt: ISO string
\`\`\`

## Solução de Problemas

### Erro: "Service database is not available"

**Causa**: O Firebase Realtime Database não está habilitado no projeto.

**Solução**:
1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. No menu lateral, clique em "Realtime Database"
4. Clique em "Criar banco de dados"
5. Siga as instruções da seção "Ativar o Realtime Database" acima
6. **NÃO ESQUEÇA** de adicionar a URL do banco de dados na variável `NEXT_PUBLIC_FIREBASE_DATABASE_URL`

### Erro: "Permission denied"

**Causa**: As regras de segurança estão muito restritivas.

**Solução**:
1. No Firebase Console, vá em "Realtime Database" > "Regras"
2. Configure as regras conforme mostrado na seção 4 acima
3. Clique em "Publicar"

### Não consigo fazer login

**Causa**: Os usuários não foram criados no Firebase Authentication.

**Solução**:
1. Vá para Firebase Console > Authentication > Users
2. Crie os usuários manualmente conforme a seção 8
3. Use os emails e senhas exatos mostrados no README

### Dados não aparecem em tempo real

**Causa**: Problema de conexão ou configuração incorreta.

**Solução**:
1. Verifique se todas as variáveis de ambiente estão corretas
2. Confirme que a `NEXT_PUBLIC_FIREBASE_DATABASE_URL` está no formato correto
3. Execute o script de verificação: `scripts/verify-firebase-setup.js`
4. Abra o console do navegador (F12) para ver erros detalhados
5. Verifique sua conexão com a internet

### Script de seed falha ao executar

**Causa**: Variáveis de ambiente não configuradas ou banco de dados não criado.

**Solução**:
1. Execute primeiro o script de verificação: `scripts/verify-firebase-setup.js`
2. Siga as instruções mostradas pelo script
3. Certifique-se de que o Realtime Database foi criado no Firebase Console
4. Verifique se a URL do banco de dados está correta

## Próximos Passos

- 🔐 Implementar autenticação real com Firebase Auth
- 🏷️ Adicionar sistema de tags múltiplas
- 📊 Dashboard com estatísticas e gráficos
- 🔔 Sistema de notificações em tempo real
- 📤 Exportação de relatórios (PDF, Excel)
- 🌐 Suporte a múltiplos idiomas
- 📱 App mobile com React Native

## Suporte

Se encontrar problemas:

1. ✅ Verifique se o Realtime Database está habilitado no Firebase Console
2. ✅ Confirme que as variáveis de ambiente estão corretas
3. ✅ Verifique as regras de segurança do Realtime Database
4. ✅ Execute o script de inicialização `seed-realtime-database.js`
5. ✅ Execute o script de verificação `verify-firebase-setup.js`
6. ✅ Abra o console do navegador (F12) para ver erros detalhados

## Licença

MIT
