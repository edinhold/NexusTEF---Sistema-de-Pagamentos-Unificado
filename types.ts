
export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CREDIT = 'Crédito',
  DEBIT = 'Débito',
  PIX = 'PIX',
  VOUCHER = 'Voucher'
}

export enum FiscalStatus {
  AUTHORIZED = 'Autorizada',
  REJECTED = 'Rejeitada',
  CONTINGENCY = 'Contingência',
  CANCELED = 'Cancelada'
}

export enum UserRole {
  MASTER = 'MASTER',
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface BankAccount {
  id: number;
  bank_name: string;
  account_type: string;
  balance: number;
  last_sync: string;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  category: string;
  stock: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  terminalId: string;
  segment: string;
  fiscalNoteId?: string;
  fiscalStatus?: FiscalStatus;
  pixQrCode?: string;
  pixCopyPaste?: string;
  cardBrand?: string;
  installments?: number;
}

export interface DigitalCertificate {
  id: string;
  alias: string;
  expirationDate: string;
  state: string;
  status: 'Ativo' | 'Expirado' | 'Alerta';
  type: 'A1' | 'A3';
}

export interface SefazStatus {
  state: string;
  status: 'Online' | 'Offline' | 'Instável';
}

export interface FiscalConfig {
  cnpj: string;
  ie: string;
  razaoSocial: string;
  cscToken: string;
  cscId: string;
  ambiente: 'Produção' | 'Homologação';
  serie: string;
  ultimoNumero: number;
  contingencia: boolean;
}

export interface Establishment {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
}
