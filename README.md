# Lavandaria Tanque Puro — Next.js + MySQL

Aplicação de gestão de lavandaria: login, gestão de utilizadores, faturação/pagamentos,
gestão financeira, serviços/artigos (com categorias), clientes (com endereço e telefone),
importação/exportação de Excel, e envio de SMS.

## 1. Pré-requisitos

- Node.js 18 ou superior
- MySQL 8 (local ou remoto)

## 2. Instalação

```bash
npm install
cp .env.example .env
```

Edita o `.env` e ajusta `DATABASE_URL` com os teus dados de acesso ao MySQL, por exemplo:

```
DATABASE_URL="mysql://root:senha@localhost:3306/lavandaria_tanque_puro"
```

A base de dados `lavandaria_tanque_puro` é criada automaticamente pela migração do Prisma
(não precisas de a criar manualmente).

## 3. Criar as tabelas e semear os dados

```bash
npm run db:setup
```

Isto corre a migração do Prisma (cria todas as tabelas) e depois o script de seed, que:
- cria as 6 categorias (Lavagem Normal, Engomagem, Lavagem Urgente, Lavagem a Seco, Limpeza de Sofá, Capa e Tapete)
- cria o utilizador `admin` / `admin123`
- cria o "Cliente Balcão"
- importa os 624 artigos originais (Engomagem, Lavagem Normal, Lavagem Urgente)

Se preferires importar diretamente por SQL (sem Prisma), o ficheiro `lavandaria_tanque_puro.sql`
fornecido anteriormente também é compatível — mas o caminho recomendado agora é o `npm run db:setup`.

## 4. Correr em desenvolvimento

```bash
npm run dev
```

Abre http://localhost:3000 — vais cair automaticamente em `/login`.
Login inicial: **admin** / **admin123**

## 5. Importação/Exportação de Excel (Serviços & Artigos)

Na página **Serviços & Artigos** existe um bloco "Importar / Exportar Excel":

- **Importar .xlsx**: aceita ficheiros como os originais (`Engomagem.xlsx`, `Lavagem_Normal.xlsx`,
  `Lavagem_Urgente.xlsx`) — escolhe a categoria no menu antes de carregar o ficheiro, já que
  esses ficheiros não têm coluna de categoria. Também aceita um único ficheiro com várias folhas,
  em que **o nome de cada folha é a categoria** (nesse caso, não escolhas categoria no menu).
  - O módulo (`lib/excel.js` + `app/api/articles/import/route.js`) **remove automaticamente**:
    - linhas sem nome ou sem preço válido;
    - duplicados (mesma categoria + nome) dentro do próprio ficheiro;
    - artigos que já existem na base de dados (mesma categoria + nome).
  - No final mostra um resumo: linhas lidas, vazias removidas, duplicadas no ficheiro,
    já existentes na base, e quantas foram efetivamente inseridas.
- **Exportar .xlsx**: descarrega um ficheiro com uma folha por categoria, no mesmo formato
  dos ficheiros originais (`Nome`, `preco_base`, `Desconto`, `disponivel`).

## 6. Módulo de SMS (avisar clientes)

Ficheiro: `lib/sms.js`, usado em:
- `app/api/notify/sms/route.js` (envio manual, ex: botão na página de Clientes)
- `app/api/invoices/[id]/route.js` (envio automático opcional ao mudar o estado do pedido
  para "Pronto para Entrega" ou "Entregue" — a interface pergunta antes de enviar)

Por omissão usa a **Twilio**. Para ativar o envio real, define no `.env`:

```
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_FROM_NUMBER="+1xxxxxxxxxx"
```

Sem estas variáveis, o módulo corre em **modo simulação**: as mensagens ficam registadas na
consola do servidor (terminal onde correste `npm run dev`) em vez de serem enviadas — útil
para testar sem gastar créditos.

Para usar outro fornecedor de SMS (ex: um gateway local moçambicano), basta alterar a função
`sendViaProvider` em `lib/sms.js` — o resto do módulo (templates, validação de número,
envio em massa) mantém-se igual.

## 7. Estrutura do projeto

```
prisma/schema.prisma       modelos da base de dados (categorias, clientes, utilizadores,
                            artigos, faturas, fatura_itens)
prisma/seed.js              popula categorias, admin, cliente balcão e os 624 artigos
lib/prisma.js                ligação Prisma
lib/auth.js                  sessão (JWT em cookie httpOnly)
lib/excel.js                 leitura/escrita de .xlsx (importação/exportação de artigos)
lib/sms.js                   envio de SMS (Twilio / modo simulação)
lib/enums.js                 mapeamento entre enums do Prisma e texto mostrado na interface
app/api/...                   rotas da API (auth, clients, articles, invoices, users, notify)
components/ui.js              sistema de design partilhado (cores, tipografia, botões, cards)
components/AppShell.jsx       barra lateral + layout autenticado (responsivo, com overlay mobile)
app/login, app/dashboard,
app/faturacao, app/clientes,
app/artigos, app/utilizadores  páginas da aplicação
```

## 8. Notas para produção

- As palavras-passe já ficam com hash (`bcryptjs`) na base de dados — nunca em texto simples.
- Troca `JWT_SECRET` por um valor longo e aleatório antes de publicar.
- Ativa HTTPS e mantém `secure: true` nos cookies (já está condicionado a `NODE_ENV=production`).
- Considera adicionar limites de tentativas de login (rate limiting) antes de publicar publicamente.
