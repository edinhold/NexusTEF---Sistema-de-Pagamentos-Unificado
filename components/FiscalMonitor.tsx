
import React from 'react';
import { SefazStatus } from '../types';

interface FiscalMonitorProps {
  states: SefazStatus[];
}

const FiscalMonitor: React.FC<FiscalMonitorProps> = ({ states }) => {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
        <span className="text-2xl">🏛️</span> Status SEFAZ Brasil
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {states.map((s) => (
          <div key={s.state} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-700">{s.state}</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                s.status === 'Online' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                s.status === 'Offline' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-amber-500 animate-pulse'
              }`}></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FiscalMonitor;
