# Visão Geral do Projeto

Este é um aplicativo de anotações em tempo real construído com Next.js 15, Firebase Realtime Database e Tailwind CSS. O aplicativo permite que os usuários criem, editem e excluam anotações, com todas as alterações sincronizadas instantaneamente entre os usuários conectados.

## Funcionalidades Implementadas

*   **Autenticação de Usuário:** Sistema de login com email e senha usando Firebase Authentication.
*   **CRUD de Anotações:** Funcionalidade completa para Criar, Ler, Atualizar e Excluir anotações.
*   **Sincronização em Tempo Real:** As alterações nas anotações são refletidas em tempo real para todos os usuários, utilizando o Firebase Realtime Database.
*   **Sistema RADAR:** Uma categoria especial de anotações ("RADAR") é exibida em uma seção dedicada para comunicações importantes.
*   **Gerenciamento de Estocagem:** Funcionalidade para gerenciar células de estocagem.
*   **Múltiplos Níveis de Acesso:** O sistema suporta diferentes papéis de usuário (admin, operador, visualizador) com permissões distintas.
*   **Design Moderno e Responsivo:** A interface é construída com Tailwind CSS e `shadcn/ui` para uma aparência limpa, moderna e responsiva.

## Estrutura do Projeto

O projeto segue a estrutura padrão do Next.js com o App Router.

*   `/app`: Contém as páginas e layouts da aplicação.
*   `/components`: Contém os componentes React reutilizáveis.
*   `/lib`: Contém as funções de utilidade e a configuração do Firebase.
*   `/scripts`: Contém scripts para popular o banco de dados e verificar a configuração.
*   `/types`: Contém as definições de tipo TypeScript para os modelos de dados.

## Plano de Ação (Próximos Passos)

*   [ ] Adicionar um novo dashboard para supervisores.
*   [ ] Implementar gráficos e estatísticas no dashboard.
*   [ ] Adicionar sistema de notificações em tempo real.
*   [ ] Permitir a exportação de relatórios em formato PDF e Excel.

