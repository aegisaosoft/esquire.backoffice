// ── Tree Node ──
export interface EsqTreeNodeDto {
  id: string;
  parentId: string;
  linkId?: string;
  name: string;
  kind: number;
  entityId: number;
  statusCode: number;
  moreRemaining: boolean;
  level: number;
  path: string[];
  desc: string;
}

// ── Entity (dynamic fields via [key]) ──
export interface EsqEntity {
  id: string;
  kind: number;
  name: string;
  desc: string;
  [key: string]: any;
}

// ── Object Kind (entity type metadata) ──
export interface EsqColumnHeader {
  columnDef: string;
  header: string;
}

export interface EsqObjectKind {
  id: number;
  name: string;
  title: string;
  plural: string;
  desc: string;
  org: boolean;
  usr: boolean;
  acct: boolean;
  icon: string;
  detailed: boolean;
  childrenDetailed: boolean;
  treeFlags: string;
  listHeaders: EsqColumnHeader[];
  childKinds: number[];
  commands: string[];
}

// ── Entity Field Definition (dictionary) ──
export interface EsqEntityField {
  name: string;
  sort: number;
  label: string;
  type: string;         // String, Flag, Integer, Number, Datetime, List, Href, Image
  tooltip: string;
  listvalues?: string[];
  nullable: string;
  nullmeaning: string;
  validation: string;
  readwrite: number;    // 0=R, 1=W, 2=RW (Integer from backend)
  format: string;
  personal?: string;
  minmax?: string;
}

/** Backend EsqEntityLayer: { layer, title, fields } */
export interface EsqEntityLayerDto {
  layer: number;
  title: string;
  fields: EsqEntityField[];
}

/** Normalized layer for UI rendering */
export interface EsqEntityLayer {
  name: string;
  fields: EsqEntityField[];
}

// ── Access Profile ──
export interface EsqPermission {
  id: number;
  kind: number;
  name: string;
  type: string;
  flags: string;  // bitmap: CRUD+Key+Acct
}

export interface EsqRole {
  id: number;
  name: string;
  adminFlg: string;
}

export interface EsqAccessProfile {
  id: string;
  kind: number;
  name: string;
  loginId: string;
  email: string;
  pwdChangeForced: string;
  tfaMethod: string;
  roles: EsqRole[];
  admin: EsqPermission[];
  tools: EsqPermission[];
}

// ── Auth ──
export interface AuthUser {
  sub: string;
  preferred_username: string;
  name: string;
  email: string;
  esq_uid: string;
  esq_rootpath: string;
  realm_access?: { roles: string[] };
}

export interface AuthState {
  authenticated: boolean;
  user?: AuthUser;
}

// ── Commands ──
export const CMD_DEFAULT = 'details';
export const CMD_NEW = 'new';
export const CMD_MOVE = 'move';
export const CMD_DELETE = 'delete';
export const CMD_KEY = 'key';
export const CMD_ACCT = 'acct';
