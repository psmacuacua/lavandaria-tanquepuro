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

## 7. Permissões: funcionário vs admin

- **Admin**: vê tudo — todas as faturas/pedidos, todos os clientes, gestão de artigos,
  gestão de utilizadores, painel financeiro completo.
- **Funcionário**: só vê e só pode alterar os **pedidos que ele próprio criou**
  (filtrado no servidor, em `app/api/invoices/route.js` e `app/api/invoices/[id]/route.js`
  — não é apenas um filtro visual, um funcionário não consegue ler nem alterar pela API
  uma fatura que não seja sua). O painel e a lista de faturação mudam automaticamente o
  texto para "Os meus pedidos" quando o utilizador não é Admin.
- Só o Admin acede à página **Utilizadores**.

## 8. Passwords: alteração própria e primeiro login obrigatório

- Todos os utilizadores têm uma página **"A Minha Conta"** (`/conta`) para alterar a sua
  própria password (pede a password atual + nova + confirmação).
- Utilizadores **novos** (criados pelo Admin) e utilizadores cuja password foi **reposta
  pelo Admin** ficam marcados com `mustChangePassword=true`: no próximo login são
  redirecionados automaticamente para `/conta` e não conseguem aceder ao resto da aplicação
  até definirem uma password própria (o menu lateral fica bloqueado, só "A Minha Conta" e
  "Sair" ficam ativos).
- O Admin pode, na página **Utilizadores**:
  - **Editar** nome, username e função de qualquer utilizador (ícone de lápis);
  - **Repor a password** de qualquer utilizador sem precisar de saber a antiga
    (ícone de chave) — isso marca automaticamente `mustChangePassword=true` para essa conta.
- O utilizador `admin` semeado (`npm run db:setup`) já começa com `mustChangePassword=false`
  para não obrigar a trocar logo a password de demonstração — mas é recomendável trocá-la
  na primeira utilização real.

## 9. Ficha de inspeção do artigo (antes da lavagem)

Na **Nova Fatura**, cada artigo adicionado ao carrinho tem um botão **"Inspecionar artigo"**
que abre uma ficha por checklist (seleção, não texto livre) para o operador registar o
estado da peça antes de a lavar — útil para provar ao cliente que um defeito já existia:

1. **Defeitos e danos pré-existentes** — furos/rasgos/descosturas, desgaste excessivo/pilling,
   botões frouxos ou em falta, zíper travado/quebrado, elástico vencido, fecho danificado.
2. **Manchas e sujidades críticas** — mancha visível (com localização), oxidação/mofo,
   desbotamento, e um destaque especial para **manchas difíceis** (café, sangue, tinta,
   vinho) que **aplicam automaticamente uma sobretaxa de +50 MT** a esse artigo.
3. **Características originais** — marca, tamanho, cor exata, se a etiqueta de lavagem
   está cortada/ilegível.
4. **Itens esquecidos nos bolsos** — confirmação de que os bolsos foram esvaziados na
   frente do cliente, e o que foi encontrado.
5. **Deformações** — lã encolhida, gola torta, terno desalinhado.

Esta ficha fica gravada por artigo dentro da fatura (`fatura_itens.condicao`, campo JSON) e
aparece resumida no recibo/detalhe da fatura, com a sobretaxa destacada quando aplicável.
A sobretaxa entra automaticamente no total da fatura.

**A ficha pode ser vista e editada mesmo depois da fatura já ter sido emitida** — basta abrir
a fatura na lista e clicar em "Ver / editar inspeção" em qualquer artigo. Se a mancha difícil
for marcada ou desmarcada depois de criada, a sobretaxa, o IVA e o total da fatura são
recalculados automaticamente (`app/api/invoices/[id]/items/[itemId]/route.js`).

## 10. IVA configurável

A taxa de IVA não fica fixa no código — é definida em **Configurações → IVA** e pode ser
mudada pelo Admin sempre que a taxa oficial mudar. Cada fatura guarda a taxa que estava em
vigor no momento em que foi emitida (`faturas.iva_percentagem` e `faturas.iva_valor`), por
isso alterar a taxa no futuro não altera faturas já emitidas — só as novas.

- Podes desligar o IVA por completo (campo "Aplicar IVA nas faturas"), útil se a lavandaria
  não for contribuinte de IVA.
- O carrinho da Nova Fatura já mostra a pré-visualização do IVA antes de emitir.
- O recibo/detalhe da fatura mostra a linha "IVA (X%)" sempre que aplicável.

## 11. Configurações da lavandaria (só Admin)

Página **Configurações** (menu lateral, só visível para Admin), com os dados que aparecem
no recibo/fatura, tudo guardado na base de dados (tabela `empresa_config`, uma única linha):

- Nome da lavandaria e logótipo (upload de imagem — fica guardado como base64 na base de
  dados; para produção com muitos acessos, considera antes alojar a imagem num serviço
  externo tipo S3/Cloudinary e colar aqui só o URL, para não sobrecarregar a base de dados)
- NUIT, email, contacto, endereço, website, conta bancária
- Taxa de IVA e se está ativo (ver secção anterior)
- **Checkboxes "Mostrar na fatura"** — o Admin escolhe exatamente quais destes dados
  (endereço, NUIT, contacto, email, website, conta bancária) aparecem no recibo; nome e
  logótipo aparecem sempre.

## 12. Estrutura do projeto

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

## 13. Notas para produção

- As palavras-passe já ficam com hash (`bcryptjs`) na base de dados — nunca em texto simples.
- Troca `JWT_SECRET` por um valor longo e aleatório antes de publicar.
- Ativa HTTPS e mantém `secure: true` nos cookies (já está condicionado a `NODE_ENV=production`).
- Considera adicionar limites de tentativas de login (rate limiting) antes de publicar publicamente.

> Se já tinhas corrido `npm run db:setup` antes desta versão, corre `npx prisma migrate dev`
> outra vez para aplicar os novos campos (`must_change_password`, `condicao`, `sobretaxa`).
>
> Se já tinhas uma base de dados com a versão anterior (IVA/configurações da empresa ainda
> não existiam), corre `npx prisma db push` (recomendado, especialmente em TiDB/PlanetScale
> onde `migrate dev` pode falhar por não haver permissão para a shadow database), ou aplica
> manualmente `prisma/fix_missing_columns_v2.sql` na tua base de dados.
