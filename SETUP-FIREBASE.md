# Guia Completo de Configuração do Firebase

## Passo 1: Criar o Firebase Realtime Database

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em **"Realtime Database"**
4. Clique em **"Criar banco de dados"**
5. Escolha a localização (recomendado: **us-central1** para melhor compatibilidade)
6. Selecione o modo de segurança: **"Modo de teste"** (para desenvolvimento)
7. Clique em **"Ativar"**

## Passo 2: Copiar a URL do Banco de Dados

Após criar o banco de dados, você verá a URL no topo da página. Ela terá um destes formatos:

- **US Central**: `https://seu-projeto-default-rtdb.firebaseio.com`
- **Outras regiões**: `https://seu-projeto-default-rtdb.REGIAO.firebasedatabase.app`

**Copie esta URL completa!**

## Passo 3: Adicionar a URL como Variável de Ambiente no v0

1. No v0, abra o **sidebar esquerdo**
2. Clique em **"Vars"** (ícone de variáveis)
3. Clique em **"Add Variable"**
4. Nome: `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
5. Valor: Cole a URL que você copiou (exemplo: `https://seu-projeto-default-rtdb.firebaseio.com`)
6. Clique em **"Save"**

## Passo 4: Importar a Estrutura do Banco de Dados

### Opção A: Importar JSON (Mais Fácil)

1. No Firebase Console, vá para **Realtime Database**
2. Clique nos **três pontos** no canto superior direito
3. Selecione **"Importar JSON"**
4. Faça upload do arquivo `firebase-database-structure.json` deste projeto
5. Clique em **"Importar"**

### Opção B: Inicialização Automática

O app tentará criar a estrutura automaticamente na primeira vez que você fizer login. Se isso não funcionar, use a Opção A.

## Passo 5: Configurar Firebase Authentication

1. No Firebase Console, vá para **Authentication**
2. Clique em **"Começar"**
3. Ative o método **"E-mail/senha"**
4. Clique na aba **"Users"**
5. Clique em **"Adicionar usuário"**
6. Crie os seguintes usuários:

### Usuários de Teste

| Email | Senha | Função |
|-------|-------|--------|
| admin@empresa.com | admin123 | Administrador |
| operador1@empresa.com | operador123 | Operador |
| supervisor@empresa.com | supervisor123 | Supervisor |

## Passo 6: Configurar Regras de Segurança

No Firebase Console, vá para **Realtime Database > Regras** e cole:

\`\`\`json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "usuarios": {
      ".indexOn": ["username", "email"]
    },
    "anotacoes": {
      ".indexOn": ["userId", "category", "createdAt"]
    }
  }
}
\`\`\`

Clique em **"Publicar"**.

## Verificação

Após completar todos os passos:

1. Recarregue o app no v0
2. Faça login com: `admin@empresa.com` / `admin123`
3. Você deve ver as anotações de exemplo e poder criar novas

## Solução de Problemas

### "Service database is not available"
- Verifique se você criou o Realtime Database (Passo 1)
- Confirme que adicionou a variável `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (Passo 3)
- Verifique se a URL está correta e completa (com https://)

### "Permission denied"
- Verifique se você configurou as regras de segurança (Passo 6)
- Confirme que está logado com um usuário válido

### "Auth error"
- Verifique se você ativou Authentication com E-mail/senha (Passo 5)
- Confirme que criou os usuários de teste

### Banco de dados vazio
- Use a Opção A do Passo 4 para importar o JSON
- Ou faça logout e login novamente para tentar a inicialização automática
