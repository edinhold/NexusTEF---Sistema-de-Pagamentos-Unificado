
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  onSave: (user: Partial<User>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  users: User[];
}

const UserManagement: React.FC<UserManagementProps> = ({ onSave, onDelete, users }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser({ ...user });
    } else {
      setEditingUser({ email: '', name: '', role: UserRole.OPERATOR });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    await onSave(editingUser);
    setIsModalOpen(false);
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Equipe</h3>
          <p className="text-slate-500 font-medium">Controle de acesso para administradores e operadores.</p>
        </div>
        <div className="flex gap-4">
          <p className="text-xs text-slate-400 max-w-[200px] text-right">
            Nota: Novos usuários devem se cadastrar na tela de login. Use esta tela para gerenciar cargos.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Criado em</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-700">{user.name}</span>
                  </div>
                </td>
                <td className="px-8 py-6 font-medium text-slate-500">{user.email}</td>
                <td className="px-8 py-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.role === UserRole.MASTER ? 'bg-rose-50 text-rose-600' :
                    user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600' : 
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-slate-400 text-xs font-medium">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button onClick={() => onDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <form onSubmit={handleSubmit}>
              <div className="p-10 border-b border-slate-50">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingUser.id ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <p className="text-slate-400 font-medium">Gerencie as permissões do colaborador.</p>
              </div>
              
              <div className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      disabled={!!editingUser.id}
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">E-mail</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingUser.id}
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 disabled:opacity-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cargo / Role</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-500"
                    >
                      <option value={UserRole.OPERATOR}>Operador</option>
                      <option value={UserRole.ADMIN}>Administrador</option>
                      <option value={UserRole.MASTER}>Master</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-slate-50 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                  {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
