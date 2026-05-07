# MOADB Loja — Projeto Standalone

Loja oficial da Mind of a Dead Body, separada do site principal.

## Estrutura

```
loja-standalone/
├── public/
│   ├── index.html
│   ├── logo.png          ← substitua pelo logo da banda
│   └── manifest.json
├── src/
│   ├── assets/           ← logo-mark.png, logo.png, bg.png
│   ├── components/
│   │   └── PromoPopup.js
│   ├── Admin.css         ← estilos do painel admin
│   ├── analytics.js
│   ├── authContext.js
│   ├── firebase.js
│   ├── index.js
│   ├── index.css
│   ├── Loja.js           ← loja pública
│   ├── Loja.css
│   ├── LojaAdmin.js      ← painel admin da loja
│   ├── LojaAdminLogin.js
│   ├── PromoAdmin.js
│   ├── reportWebVitals.js
│   └── RequireAuth.js
├── .env.example          ← copie para .env e preencha
├── .gitignore
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── package.json
```

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Firebase

1. Crie um novo projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative **Firestore**, **Storage** e **Authentication** (e-mail/senha)
3. Copie `.env.example` para `.env` e preencha com as credenciais:

```bash
cp .env.example .env
```

### 3. Configurar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Selecione: **Hosting**, **Firestore**, **Storage**

### 4. Rodar localmente

```bash
npm start
```

### 5. Deploy

```bash
npm run build
firebase deploy --only hosting
```

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Catálogo da loja |
| `/:id` | Página do produto |
| `/admin` | Painel admin (requer login) |
| `/admin/login` | Login do admin |

## Reativar/desativar loja

Em `src/Loja.js`, linha com `LOJA_OFFLINE`:

```js
const LOJA_OFFLINE = true;  // true = tela "Em Breve" | false = loja ativa
```

## Dados no Firestore

Os dados da loja ficam em `siteData/moadb_shop` com a estrutura:

```json
{
  "content": {
    "storeUrl": "https://...",
    "items": [...]
  }
}
```
