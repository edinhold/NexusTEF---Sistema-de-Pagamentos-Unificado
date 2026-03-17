
import React from 'react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.MASTER] },
    { id: 'pdv', label: 'PDV / Vendas', icon: '🛒', roles: [UserRole.ADMIN, UserRole.MASTER, UserRole.OPERATOR] },
    { id: 'establishment', label: 'Empresa', icon: '🏢', roles: [UserRole.ADMIN, UserRole.MASTER] },
    { id: 'products', label: 'Produtos', icon: '📦', roles: [UserRole.ADMIN, UserRole.MASTER, UserRole.OPERATOR] },
    { id: 'transactions', label: 'Transações', icon: '💸', roles: [UserRole.ADMIN, UserRole.MASTER, UserRole.OPERATOR] },
    { id: 'fiscal', label: 'Fiscal NFC-e', icon: '📝', roles: [UserRole.ADMIN, UserRole.MASTER] },
    { id: 'users', label: 'Usuários', icon: '👥', roles: [UserRole.ADMIN, UserRole.MASTER] },
    { id: 'certificates', label: 'Certificados', icon: '🔐', roles: [UserRole.ADMIN, UserRole.MASTER] },
    { id: 'banks', label: 'Bancos', icon: '🏦', roles: [UserRole.ADMIN, UserRole.MASTER] },
    { id: 'simulator', label: 'Simulador TEF', icon: '⚙️', roles: [UserRole.ADMIN, UserRole.MASTER] },
  ];

  const filteredItems = menuItems.filter(item => 
    !currentUser || item.roles.includes(currentUser.role)
  );

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white p-6 hidden md:flex flex-col border-r border-slate-800 z-50">
      <div className="mb-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/20">
          N
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">NexusTEF</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">V6 Enterprise</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-4 ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl opacity-80">{item.icon}</span>
            <span className="font-semibold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-8 mt-8 border-t border-slate-800/50">
        <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/30 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
            <p className="text-xs font-bold text-slate-200">{currentUser?.name || 'Usuário'}</p>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{currentUser?.role || 'Acesso'}</p>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Sair do Sistema
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
