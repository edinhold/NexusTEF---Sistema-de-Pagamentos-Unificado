
import { PaymentMethod, PaymentStatus, Transaction, DigitalCertificate, FiscalStatus, SefazStatus } from './types';

export const ALL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { 
    id: 'TX-1001', 
    timestamp: new Date().toISOString(), 
    amount: 150.50, 
    method: PaymentMethod.CREDIT, 
    status: PaymentStatus.SUCCESS, 
    terminalId: 'TERM-01', 
    segment: 'Restaurante', 
    fiscalNoteId: '5421', 
    fiscalStatus: FiscalStatus.AUTHORIZED 
  },
  { 
    id: 'TX-1002', 
    timestamp: new Date().toISOString(), 
    amount: 42.00, 
    method: PaymentMethod.PIX, 
    status: PaymentStatus.SUCCESS, 
    terminalId: 'TERM-02', 
    segment: 'Vestuário', 
    fiscalNoteId: '5422', 
    fiscalStatus: FiscalStatus.AUTHORIZED 
  }
];

export const SEFAZ_STATES: SefazStatus[] = ALL_UFS.map(uf => ({
  state: uf,
  status: Math.random() > 0.1 ? 'Online' : (Math.random() > 0.5 ? 'Instável' : 'Offline')
}));

export const CHART_DATA = [
  { name: 'Seg', valor: 450, pix: 120 },
  { name: 'Ter', valor: 890, pix: 340 },
  { name: 'Qua', valor: 1200, pix: 560 },
  { name: 'Qui', valor: 1500, pix: 890 },
  { name: 'Sex', valor: 2100, pix: 1100 },
  { name: 'Sab', valor: 1800, pix: 950 },
  { name: 'Dom', valor: 2400, pix: 1400 },
];
