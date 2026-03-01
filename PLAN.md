# Plan: Rewrite Frontend — Angular → React + Node.js BFF

## Context
Rewrite the Esquire Explorer Angular 20 frontend as a React SPA with a Node.js BFF (Backend-for-Frontend) proxy. The BFF handles Keycloak authentication server-side (tokens never exposed to browser), proxies API calls to Spring Gateway with Bearer token injection. Full feature parity with the existing Angular app.

**Source (reference):** `C:\aegis-miron\esquire.explorer\frontend\`
**Target (new code):** `C:\aegis-esquire\esquire.services.net\`

## Architecture

```
Browser ──→ React SPA (Vite + MUI)
                 │
         fetch(/api/*)
                 │
             Node.js BFF (Express, port 3000)
             ├── /auth/login    → redirect to Keycloak
             ├── /auth/callback → exchange code for tokens
             ├── /auth/logout   → revoke + clear session
             ├── /auth/me       → return user info + roles
             ├── /api/*         → proxy to Spring Gateway (7070)
             │                    with Bearer token from session
             └── static files   → serve React build (prod)
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Client build | Vite + React 19 + TypeScript | Fast dev, modern |
| UI | MUI v6 (Material UI) | Closest to Angular Material |
| Data fetching | TanStack Query v5 | Caching, loading states |
| Client state | Zustand | Lightweight, tree/selection state |
| Server | Express + TypeScript | Simple, proven BFF |
| Auth | openid-client v6 | Server-side Keycloak OIDC |
| Proxy | http-proxy-middleware | API proxy to gateway |
| Session | express-session + memorystore | Token storage (Redis-ready) |

## Project Structure

```
C:\aegis-esquire\esquire.services.net\
├── package.json                 # Workspace root (npm workspaces)
├── tsconfig.base.json
├── client/                      # React SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # Router + Auth provider
│       ├── theme.ts             # MUI indigo-pink theme
│       ├── api/
│       │   ├── client.ts        # fetch wrapper
│       │   ├── hooks.ts         # useTree, useEntity, useDictionary, etc.
│       │   └── types.ts         # EsqTreeNode, EsqEntity, EsqObjectKind, etc.
│       ├── store/
│       │   └── explorerStore.ts # Zustand: expanded, selected, history
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx
│       │   │   └── Toolbar.tsx
│       │   ├── tree/
│       │   │   ├── TreePanel.tsx
│       │   │   └── TreeNode.tsx
│       │   ├── list/
│       │   │   ├── ListView.tsx
│       │   │   └── ListContextMenu.tsx
│       │   ├── dialogs/
│       │   │   ├── EntityDetailsDialog.tsx
│       │   │   ├── AccessProfileDialog.tsx
│       │   │   ├── NodeDetailsDialog.tsx
│       │   │   └── SingleEntryDialog.tsx
│       │   ├── fields/
│       │   │   ├── TabField.tsx
│       │   │   ├── TabString.tsx
│       │   │   ├── TabList.tsx
│       │   │   └── TabIknfTable.tsx
│       │   └── common/
│       │       ├── ContextMenu.tsx
│       │       └── ResizablePanel.tsx
│       └── utils/
│           ├── objectKinds.ts
│           ├── nodeStatus.ts
│           ├── permissions.ts
│           └── tracing.ts
├── server/                      # Node.js BFF
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── auth/
│       │   ├── keycloak.ts      # openid-client OIDC discovery
│       │   └── routes.ts        # /auth/* endpoints
│       ├── proxy/
│       │   └── gateway.ts       # http-proxy-middleware → gateway
│       └── middleware/
│           ├── session.ts
│           ├── requireAuth.ts
│           └── tracing.ts
└── Dockerfile                   # Multi-stage build
```

## Implementation Steps

### Step 1: Workspace scaffold ✅ DONE
Root `package.json` with npm workspaces, shared tsconfig, both sub-packages with deps.
Files created: `package.json`, `tsconfig.base.json`, `server/package.json`, `server/tsconfig.json`

### Step 2: Node.js BFF
- Express + TS, openid-client Keycloak OIDC (authorization_code + PKCE)
- express-session with httpOnly cookies, tokens stored server-side
- `/auth/login` → Keycloak redirect, `/auth/callback` → token exchange, `/auth/me` → claims
- http-proxy-middleware: `/api/*` → `http://esq-gateway:7070/*` with `Authorization: Bearer`
- X-Request-ID / X-Correlation-ID header injection

### Step 3: React core + layout
- Vite project, MUI theme (indigo-pink), AppShell with toolbar + sidebar + main
- Auth context (fetch `/auth/me`), login redirect if unauthenticated
- TanStack QueryClient setup

### Step 4: Tree panel
- `useTree(parentId)` hook → `GET /api/esq?id=...`
- `useKinds()` hook → `GET /api/esq-kinds`
- MUI RichTreeView with lazy loading, icons, status colors
- Zustand: expanded nodes, selected node, back/forward history

### Step 5: List view
- MUI DataGrid showing children of selected node
- Dynamic columns from `EsqObjectKind.listHeaders[]`
- Double-click → entity details dialog, keyboard nav, context menu

### Step 6: Entity details dialog
- `useEntityDetails(kind, id)` + `useDictionary(kind)` hooks
- MUI Dialog + Tabs, dynamic field renderer by type
- Edit mode with dirty tracking, save via POST

### Step 7: Access profile dialog
- `useAccessProfile(id)` hook, roles + permissions display
- CRUD flags table, edit + save

### Step 8: Context menu + commands
- Details, New, Move, Delete, Key, Acct commands
- Permission check from access profile
- Dynamic "New..." submenu from childKinds

### Step 9: Keyboard navigation
- Arrows for tree/list, Enter → details, Ctrl+arrows, history nav

### Step 10: Docker + deployment
- Multi-stage Dockerfile, compose.yaml integration

## API Mapping (BFF → Gateway)

| React fetch | Gateway |
|------------|---------|
| `GET /api/esq` | `GET /esq` |
| `GET /api/esq-path/:id` | `GET /esq-path/:id` |
| `GET /api/esq-cmd` | `GET /esq-cmd` |
| `GET /api/esq-enode` | `GET /esq-enode` |
| `GET /api/esq-dict/:kind` | `GET /esq-dict/:kind` |
| `GET /api/esq-key` | `GET /esq-key` |
| `GET /api/esq-kinds` | `GET /esq-kinds` |
| `POST /api/esq-cmd-save` | `POST /esq-cmd-save` |
| `POST /api/esq-cmd-asave` | `POST /esq-cmd-asave` |
| `PUT /api/esq-key-save` | `PUT /esq-key-save` |

## Key Data Types (from Angular, replicate in React)

```typescript
interface EsqTreeNodeDto {
  id: string; parentId: string; linkId?: string;
  name: string; kind: number; entityId: number;
  statusCode: number; moreRemaining: boolean;
  level: number; path: string[]; desc: string;
}

interface EsqEntity {
  id: string; kind: number; name: string; desc: string;
  [key: string]: any; // dynamic custom fields
}

interface EsqObjectKind {
  id: number; name: string; title: string; plural: string;
  icon: string; childKinds: number[];
  listHeaders: { name: string; label: string }[];
  commands: string[];
}

interface EsqAccessProfile {
  id: string; kind: number; name: string;
  loginId: string; email: string;
  roles: { id: number; name: string; adminFlg: string }[];
  admin: EsqPermission[]; tools: EsqPermission[];
}

interface EsqEntityField {
  name: string; label: string; type: string;
  sort: number; layer: string; readwrite: string;
  listvalues?: string[]; validation?: string;
}
```

## Angular Source Files Reference

Key files to port from `C:\aegis-miron\esquire.explorer\frontend\src\`:
- `esquire.ui/api/EsqRestApi.ts` — API interface (9 methods)
- `esquire.ui/api/EsqTreeNode.ts` — Tree node model with signals
- `esquire.ui/api/EsqObjectKind.ts` — Entity kind definitions
- `esquire.ui/api/EsqAccessProfile.ts` — Access profile model
- `esquire.ui/api/EsqContextMenuBuilder.ts` — Context menu builder
- `esquire.ui/explorer/flatTree/EsqExplorerComponent.ts` — Main explorer (906 lines)
- `esquire.ui/explorer/flatTree/EsqFlatTreeDatasource.ts` — Tree datasource
- `esquire.ui/components/EsqNodeDetailsDialog.ts` — Node details dialog
- `esquire.ui/components/EsqEntityDetailsDialog.ts` — Entity details with tabs
- `esquire.ui/components/EsqAccessProfileDialog.ts` — Access profile dialog
- `esquire.ui/components/EsqTabFieldComponent.ts` — Dynamic field renderer
- `rest/api/esquire.service.ts` — OpenAPI generated REST client
- `app/interceptor/tracingInterceptor.ts` — X-Request-ID injection
- `app/interceptor/rfc9457Interceptor.ts` — Error handling
- `main.ts` — Keycloak init with PKCE, check-sso, auto-refresh

## Verification
1. `npm install` at workspace root
2. `npm run dev` — starts both server (3000) and client (5173)
3. Browser → localhost:5173 → Keycloak login redirect
4. Login → tree loads, click nodes → list populates
5. Double-click → entity details dialog with tabs and fields
6. Right-click → context menu with commands
7. All API calls go through BFF (no direct browser→gateway)
