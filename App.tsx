
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import TransactionTable from './components/TransactionTable';
import FiscalMonitor from './components/FiscalMonitor';
import Login from './components/Login';
import PDV from './components/PDV';
import UserManagement from './components/UserManagement';
import { SEFAZ_STATES, ALL_UFS } from './constants';
import { PaymentMethod, PaymentStatus, Transaction, FiscalStatus, DigitalCertificate, User, UserRole, BankAccount, Product, Establishment } from './types';
import { getSmartInsights } from './services/geminiService';
import { auth, db } from './src/firebase';
import firebaseConfig from './firebase-applet-config.json';
import { initializeApp } from 'firebase/app';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, query, where, setDoc, deleteDoc } from 'firebase/firestore';

const API_URL = '/api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pdv');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [establishment, setEstablishment] = useState<Establishment>({
    razaoSocial: '', nomeFantasia: '', cnpj: '', endereco: '', telefone: '', email: ''
  });
  
  // States for modals and UI
  const [isSimulating, setIsSimulating] = useState(false);
  const [showPixModal, setShowPixModal] = useState<Transaction | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<Transaction | null>(null);
  const [showCardSimModal, setShowCardSimModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState<Transaction | null>(null);
  
  const [simStep, setSimStep] = useState<'brand' | 'method' | 'installments'>('brand');
  const [simData, setSimData] = useState({ brand: '', method: PaymentMethod.CREDIT, installments: 1 });
  const [isCertifying, setIsCertifying] = useState(false);
  const [certPhase, setCertPhase] = useState(0);
  const [selectedUf, setSelectedUf] = useState('MT');
  const [activeCertId, setActiveCertId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCert, setEditingCert] = useState<Partial<DigitalCertificate> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      console.warn("API Error:", e);
      return [];
    }
  };

  const loadData = async () => {
    const [txData, certData, bankData, prodData, estData] = await Promise.all([
      safeFetch(`${API_URL}?action=get_transactions`),
      safeFetch(`${API_URL}?action=get_certificates`),
      safeFetch(`${API_URL}?action=get_bank_accounts`),
      safeFetch(`${API_URL}?action=get_products`),
      safeFetch(`${API_URL}?action=get_establishment`),
    ]);
    
    if (Array.isArray(txData)) setTransactions(txData);
    if (Array.isArray(bankData)) setBankAccounts(bankData);
    if (Array.isArray(prodData)) setProductsList(prodData);
    if (Array.isArray(certData)) {
      setCertificates(certData);
      const mtCert = certData.find(c => c.state === 'MT');
      if (mtCert) { setActiveCertId(mtCert.id); setSelectedUf('MT'); }
      else if (certData.length > 0) { setActiveCertId(certData[0].id); setSelectedUf(certData[0].state); }
    }
    if (estData && !estData.status) setEstablishment(estData);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setCurrentUser(userData);
          if (userData.role === UserRole.OPERATOR) setActiveTab('pdv');
          else setActiveTab('dashboard');
        } else {
          // Fallback if doc doesn't exist yet (e.g. first Google login)
          const role = firebaseUser.email === 'edinhold@gmail.com' ? UserRole.MASTER : UserRole.ADMIN;
          const userData: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            role: role,
            created_at: new Date().toISOString()
          };
          // Save the doc if it doesn't exist
          await setDoc(doc(db, 'users', firebaseUser.uid), userData);
          setCurrentUser(userData);
          setActiveTab('dashboard');
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MASTER)) {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data() as User);
        setUsers(usersData);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => { 
    if (currentUser) loadData(); 
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === UserRole.OPERATOR) setActiveTab('pdv');
    else setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleSaveUser = async (user: Partial<User> & { password?: string }) => {
    setIsSaving(true);
    try {
      if (!user.id) {
        // Creating a new user
        if (!user.email || !user.password) {
          alert('E-mail e senha são obrigatórios para novos usuários.');
          return;
        }

        // Use a secondary Firebase app to create the user without logging out the admin
        const secondaryApp = initializeApp(firebaseConfig, 'Secondary');
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
        const firebaseUser = userCredential.user;
        
        const userData: User = {
          id: firebaseUser.uid,
          name: user.name || 'Novo Usuário',
          email: user.email,
          role: user.role || UserRole.OPERATOR,
          created_at: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        // Clean up secondary app
        await secondaryAuth.signOut();
        // Note: secondaryApp.delete() is not strictly needed but good practice if it were available
        
        alert('Usuário criado com sucesso!');
      } else {
        // Updating existing user
        await setDoc(doc(db, 'users', user.id), user, { merge: true });
        alert('Usuário atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Error saving user:', error);
      alert('Erro ao salvar usuário: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário?')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      alert('Usuário removido do banco de dados. Nota: O acesso via Auth ainda pode persistir até a limpeza manual.');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert('Erro ao excluir usuário: ' + error.message);
    }
  };

  const handlePDVPayment = async (method: PaymentMethod, amount: number, items: any[]) => {
    setIsSimulating(true);
    const txId = `TX-${Math.floor(Math.random() * 900000 + 100000)}`;
    
    const baseTx: Transaction = {
      id: txId,
      timestamp: new Date().toISOString(),
      amount: amount,
      method: method,
      status: PaymentStatus.PENDING,
      terminalId: 'TERM-NEXUS-V6',
      segment: establishment.nomeFantasia || 'Varejo Pro',
      installments: 1
    };

    if (method === PaymentMethod.PIX) {
      const pixTx = { ...baseTx, pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PIX-${txId}` };
      setShowPixModal(pixTx);
      setIsSimulating(false);
      setTimeout(() => {
        const successTx = { ...pixTx, status: PaymentStatus.SUCCESS };
        saveTransaction(successTx);
        setShowPixModal(null);
        setShowSuccessModal(successTx);
      }, 3000);
    } else {
      // Simulação de cartão
      setSimData({ brand: 'Visa', method: method, installments: 1 });
      setSimStep('brand');
      setShowCardSimModal(true);
      // O simulateTransaction original será chamado pelos botões do modal
    }
  };

  const saveTransaction = async (tx: Transaction) => {
    await fetch(`${API_URL}?action=save_transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    loadData();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await fetch(`${API_URL}?action=save_product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct)
    });
    setShowProductModal(false);
    loadData();
    setIsSaving(false);
  };

  const handleSaveCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await fetch(`${API_URL}?action=save_certificate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingCert)
    });
    setShowCertModal(false);
    loadData();
    setIsSaving(false);
  };

  const handleSaveEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await fetch(`${API_URL}?action=save_establishment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(establishment)
    });
    alert('Empresa salva com sucesso!');
    setIsSaving(false);
  };

  const simulateTransaction = async (method: PaymentMethod, details?: { brand: string, installments: number }) => {
    setIsSimulating(true);
    const amount = Number((Math.random() * 500 + 10).toFixed(2));
    const txId = `TX-${Math.floor(Math.random() * 900000 + 100000)}`;
    
    const baseTx: Transaction = {
      id: txId,
      timestamp: new Date().toISOString(),
      amount: amount,
      method: method,
      status: PaymentStatus.PENDING,
      terminalId: 'TERM-NEXUS-V6',
      segment: establishment.nomeFantasia || 'Varejo Pro',
      cardBrand: details?.brand,
      installments: details?.installments || 1
    };

    if (method === PaymentMethod.PIX) {
      const pixTx = { ...baseTx, pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=PIX-${txId}` };
      setShowPixModal(pixTx);
      setIsSimulating(false);
      setTimeout(() => {
        const successTx = { ...pixTx, status: PaymentStatus.SUCCESS };
        saveTransaction(successTx);
        setShowPixModal(null);
        setShowSuccessModal(successTx);
      }, 3000);
    } else {
      await new Promise(r => setTimeout(r, 2000));
      const successTx = { ...baseTx, status: PaymentStatus.SUCCESS };
      saveTransaction(successTx);
      setIsSimulating(false);
      setShowCardSimModal(false);
      setShowSuccessModal(successTx);
    }
  };

  const handleCertify = async (txId: string) => {
    if (!activeCertId) return alert('Selecione um certificado válido.');
    setIsCertifying(true);
    for (let i = 1; i <= 3; i++) { setCertPhase(i); await new Promise(r => setTimeout(r, 600)); }
    const res = await safeFetch(`${API_URL}?action=certify_transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, certId: activeCertId, uf: selectedUf })
    });
    if (res.status === 'success') loadData();
    setIsCertifying(false);
    setCertPhase(0);
  };

  const totalBankBalance = useMemo(() => bankAccounts.reduce((acc, curr) => acc + Number(curr.balance), 0), [bankAccounts]);
  const stats = useMemo(() => {
    const success = transactions.filter(t => t.status === PaymentStatus.SUCCESS);
    return {
      total: success.reduce((a, b) => a + Number(b.amount), 0),
      count: success.length
    };
  }, [transactions]);

  // Render Functions
  const renderProducts = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Estoque de Produtos</h3>
          <p className="text-slate-500 font-medium">Gestão centralizada para venda rápida.</p>
        </div>
        <button onClick={() => { setEditingProduct({ name: '', sku: '', price: 0, category: '', stock: 0 }); setShowProductModal(true); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
          + Adicionar Produto
        </button>
      </div>
      <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qtd</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {productsList.map(prod => (
              <tr key={prod.id} className="group hover:bg-slate-50 transition-all">
                <td className="px-8 py-6">
                  <p className="font-black text-slate-900 text-sm">{prod.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{prod.sku}</p>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase">{prod.category}</span>
                </td>
                <td className="px-8 py-6 text-center font-mono text-sm font-bold">{prod.stock}</td>
                <td className="px-8 py-6 font-black text-slate-900 text-sm">R$ {Number(prod.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => { setEditingProduct(prod); setShowProductModal(true); }} className="text-indigo-600 font-black text-[10px] uppercase hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Cofre Fiscal</h3>
          <p className="text-slate-500 font-medium">Gerencie certificados para todos os estados, priorizando Mato Grosso.</p>
        </div>
        <button onClick={() => { setEditingCert({ alias: '', state: 'MT', type: 'A1', expirationDate: '' }); setShowCertModal(true); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
          + Vincular Certificado
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {certificates.map(c => (
          <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group hover:shadow-xl transition-all overflow-hidden">
            <div className={`absolute top-0 right-0 p-6`}>
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${c.state === 'MT' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                 UF: {c.state} {c.state === 'MT' && '⭐'}
               </span>
            </div>
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-6">🔐</div>
            <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{c.alias}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Modelo {c.type} • e-CNPJ</p>
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-400">Expira em</span>
               <span className="text-slate-900">{new Date(c.expirationDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBanks = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Conciliação Bancária</h3>
          <p className="text-slate-500 font-medium">Sincronização em tempo real com todos os bancos (Open Finance).</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bankAccounts.map(bank => (
          <div key={bank.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
            <div className="flex items-center justify-between mb-8">
               <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all">🏦</div>
               <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Sincronizado</span>
            </div>
            <h4 className="text-2xl font-black text-slate-900 mb-1">{bank.bank_name}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{bank.account_type}</p>
            <div className="pt-6 border-t border-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Saldo Atual</p>
               <p className="text-3xl font-black text-slate-900">R$ {Number(bank.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-40">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">NexusTEF <span className="text-indigo-600">Enterprise</span></h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Plataforma Unificada</span>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Global</p>
                <p className="text-lg font-black text-emerald-600">R$ {totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
             <div className="w-px h-10 bg-slate-100"></div>
             <div className="flex items-center gap-3 bg-indigo-50 p-2 pr-5 rounded-2xl border border-indigo-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                  {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MASTER) ? '👑' : '👤'}
                </div>
                <div className="text-left leading-none">
                  <p className="text-xs font-black text-indigo-900 uppercase">{currentUser.name}</p>
                  <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">{currentUser.role}</p>
                </div>
             </div>
          </div>
        </header>

        <main className="p-12 max-w-[1500px] w-full mx-auto">
          {activeTab === 'pdv' && (
            <PDV 
              products={productsList} 
              onProcessPayment={handlePDVPayment} 
              isProcessing={isSimulating} 
            />
          )}

          {activeTab === 'users' && (
            <UserManagement 
              users={users} 
              onSave={handleSaveUser} 
              onDelete={handleDeleteUser} 
            />
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard label="Total Vendas" value={`R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon="💰" color="bg-indigo-50" />
                <StatCard label="Disponível Bancos" value={`R$ ${totalBankBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon="🏦" color="bg-emerald-50" />
                <StatCard label="Fiscal Pendente" value={transactions.filter(t => !t.fiscalNoteId).length} icon="📝" color="bg-rose-50" />
                <StatCard label="Produtos" value={productsList.length} icon="📦" color="bg-amber-50" />
              </div>
              <FiscalMonitor states={SEFAZ_STATES} />
              <TransactionTable transactions={transactions.slice(0, 5)} />
            </div>
          )}

          {activeTab === 'establishment' && (
             <div className="max-w-4xl mx-auto space-y-8">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Configurações da Empresa</h3>
                <form onSubmit={handleSaveEstablishment} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2 col-span-full"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Razão Social</label><input type="text" required value={establishment.razaoSocial} onChange={e => setEstablishment({...establishment, razaoSocial: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Fantasia</label><input type="text" required value={establishment.nomeFantasia} onChange={e => setEstablishment({...establishment, nomeFantasia: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">CNPJ</label><input type="text" required value={establishment.cnpj} onChange={e => setEstablishment({...establishment, cnpj: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail</label><input type="email" required value={establishment.email} onChange={e => setEstablishment({...establishment, email: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone</label><input type="text" required value={establishment.telefone} onChange={e => setEstablishment({...establishment, telefone: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-black outline-none" /></div>
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition-all">Salvar Dados Cadastrais</button>
                </form>
             </div>
          )}

          {activeTab === 'products' && renderProducts()}
          {activeTab === 'certificates' && renderCertificates()}
          {activeTab === 'banks' && renderBanks()}
          {activeTab === 'transactions' && <TransactionTable transactions={transactions} />}

          {activeTab === 'fiscal' && (
            <div className="space-y-8">
               <div className="bg-slate-900 p-12 rounded-[4rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                  <div className="max-w-md z-10">
                     <h3 className="text-3xl font-black mb-4">Módulo Sefaz MT ⭐</h3>
                     <p className="text-indigo-300 text-sm">O sistema prioriza Mato Grosso para transmissões de NFC-e. Configure outros estados se necessário.</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/10 z-10">
                     <p className="text-[10px] font-black uppercase text-indigo-400 mb-2">Estado de Emissão</p>
                     <select value={selectedUf} onChange={e => setSelectedUf(e.target.value)} className="bg-transparent text-xl font-black outline-none cursor-pointer">
                        {ALL_UFS.map(uf => <option key={uf} value={uf} className="bg-slate-900">{uf === 'MT' ? 'MT (Sede)' : uf}</option>)}
                     </select>
                  </div>
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full"></div>
               </div>
               <TransactionTable transactions={transactions} />
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Simulador de Terminal TEF</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => simulateTransaction(PaymentMethod.PIX)} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
                  <div className="text-5xl mb-6 bg-emerald-50 w-24 h-24 flex items-center justify-center rounded-[2.5rem] mx-auto group-hover:rotate-12 transition-transform">⚡</div>
                  <h4 className="text-2xl font-black text-slate-900">Checkout PIX</h4>
                  <p className="text-sm text-slate-400 mt-2">QR Code Estático/Dinâmico.</p>
                </button>
                <button onClick={() => { setSimStep('brand'); setShowCardSimModal(true); }} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
                  <div className="text-5xl mb-6 bg-indigo-50 w-24 h-24 flex items-center justify-center rounded-[2.5rem] mx-auto group-hover:-rotate-12 transition-transform">💳</div>
                  <h4 className="text-2xl font-black text-slate-900">Débito / Crédito</h4>
                  <p className="text-sm text-slate-400 mt-2">Simular Pinpad Integrado.</p>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals Restoration */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in zoom-in">
          <div className="bg-white p-12 rounded-[4rem] w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase">Gestão de Produto</h3>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Nome</label><input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Preço</label><input type="number" step="0.01" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Estoque</label><input type="number" required value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none" /></div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-4 bg-slate-100 font-black text-xs uppercase">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl">Gravar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCertModal && editingCert && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 animate-in zoom-in">
          <div className="bg-white p-12 rounded-[4rem] w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase">Vincular Certificado</h3>
            <form onSubmit={handleSaveCert} className="space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Identificação</label><input type="text" required value={editingCert.alias} onChange={e => setEditingCert({...editingCert, alias: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none" placeholder="Ex: Matriz Mato Grosso" /></div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Estado (UF)</label>
                    <select value={editingCert.state} onChange={e => setEditingCert({...editingCert, state: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none">
                       {ALL_UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Tipo</label>
                    <select value={editingCert.type} onChange={e => setEditingCert({...editingCert, type: e.target.value as any})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none">
                       <option value="A1">Arquivo A1</option>
                       <option value="A3">Cartão A3</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Expiração</label><input type="date" required value={editingCert.expirationDate} onChange={e => setEditingCert({...editingCert, expirationDate: e.target.value})} className="w-full bg-slate-50 p-5 rounded-2xl text-sm font-black outline-none" /></div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCertModal(false)} className="flex-1 py-4 bg-slate-100 font-black text-xs uppercase">Fechar</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase">Ativar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIX Modal */}
      {showPixModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[1000] flex items-center justify-center p-6">
           <div className="bg-white p-12 rounded-[5rem] w-full max-w-md shadow-2xl text-center">
              <h3 className="text-2xl font-black mb-8">Pagamento via PIX</h3>
              <div className="bg-slate-50 p-10 rounded-[4rem] mb-10 shadow-inner">
                 <img src={showPixModal.pixQrCode} className="w-56 h-56 mx-auto" alt="QR" />
              </div>
              <p className="text-5xl font-black text-slate-900 mb-4">R$ {showPixModal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs font-black text-emerald-500 uppercase animate-pulse">Sincronizando com Banco Central...</p>
           </div>
        </div>
      )}

      {/* Card Simulator Modal */}
      {showCardSimModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-[1000] flex items-center justify-center p-6 animate-in zoom-in">
           <div className="bg-white w-full max-w-sm rounded-[4rem] shadow-2xl overflow-hidden">
              <div className="bg-slate-900 p-8 text-center text-indigo-400 font-black text-xs uppercase tracking-[0.3em] border-b border-indigo-500/20">Nexus V6 Enterprise</div>
              <div className="p-12">
                 {simStep === 'brand' && (
                    <div className="grid grid-cols-2 gap-4">
                       {['Visa', 'Mastercard', 'Elo', 'Amex'].map(brand => (
                          <button key={brand} onClick={() => { setSimData({...simData, brand}); setSimStep('method'); }} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-800 uppercase text-[10px] hover:bg-indigo-600 hover:text-white transition-all shadow-sm">{brand}</button>
                       ))}
                    </div>
                 )}
                 {simStep === 'method' && (
                    <div className="space-y-4">
                       <button onClick={() => simulateTransaction(PaymentMethod.DEBIT, { brand: simData.brand, installments: 1 })} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl">Débito</button>
                       <button onClick={() => setSimStep('installments')} className="w-full py-6 bg-slate-50 text-slate-900 rounded-3xl font-black uppercase text-xs border border-slate-100">Crédito</button>
                    </div>
                 )}
                 {simStep === 'installments' && (
                    <div className="grid grid-cols-3 gap-3">
                       {[1, 2, 3, 4, 6, 12].map(n => (
                          <button key={n} onClick={() => simulateTransaction(PaymentMethod.CREDIT, { brand: simData.brand, installments: n })} className="p-4 bg-slate-50 border rounded-xl font-black text-slate-700 hover:bg-indigo-600 hover:text-white transition-all">{n}x</button>
                       ))}
                    </div>
                 )}
                 <button onClick={() => setShowCardSimModal(false)} className="w-full mt-10 py-3 text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
              </div>
           </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-emerald-950/40 backdrop-blur-3xl z-[1100] flex items-center justify-center p-6">
           <div className="bg-white p-12 rounded-[5rem] w-full max-w-sm text-center shadow-2xl animate-in bounce-in duration-500">
              <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">✅</div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">Pagamento OK!</h4>
              <p className="text-sm text-slate-400 mb-10">Transação aprovada e gravada no cofre de dados.</p>
              <button onClick={() => { handleCertify(showSuccessModal.id); setShowSuccessModal(null); setActiveTab('fiscal'); }} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-xl">Emitir Fiscal (MT)</button>
              <button onClick={() => setShowSuccessModal(null)} className="mt-4 text-[10px] font-black text-slate-400 uppercase">Ignorar Fiscal</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
