
import React from 'react';
import { Transaction, PaymentStatus, FiscalStatus } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  const getStatusStyle = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.SUCCESS: return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
      case PaymentStatus.FAILED: return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getFiscalStyle = (status?: FiscalStatus) => {
    switch (status) {
      case FiscalStatus.AUTHORIZED: return 'text-emerald-500 bg-emerald-50';
      case FiscalStatus.CONTINGENCY: return 'text-amber-500 bg-amber-50';
      case FiscalStatus.REJECTED: return 'text-rose-500 bg-rose-50';
      default: return 'text-slate-300 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm animate-in slide-in-from-bottom duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Fiscal</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Método / Bandeira</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagamento</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sefaz NFC-e</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                <td className="px-8 py-5">
                  <div className="font-mono text-[11px] font-bold text-slate-500">{tx.id}</div>
                  <div className="text-[10px] text-indigo-400 font-bold">Nota: {tx.fiscalNoteId || 'N/A'}</div>
                </td>
                <td className="px-8 py-5 text-xs font-medium text-slate-600">
                  {new Date(tx.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-8 py-5">
                  <p className="text-sm font-black text-slate-900">R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  {tx.installments && tx.installments > 1 && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{tx.installments}x de R$ {(tx.amount / tx.installments).toFixed(2)}</p>
                  )}
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col gap-1">
                    <span className={`w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase ${tx.method === 'PIX' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-600'}`}>
                      {tx.method}
                    </span>
                    {tx.cardBrand && (
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                         🔹 {tx.cardBrand}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusStyle(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg ${getFiscalStyle(tx.fiscalStatus)}`}>
                    {tx.fiscalStatus || 'Sem Nota'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
