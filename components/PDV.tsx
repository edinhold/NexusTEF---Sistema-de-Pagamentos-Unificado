
import React, { useState, useMemo } from 'react';
import { Product, PaymentMethod, Transaction, PaymentStatus } from '../types';

interface PDVProps {
  products: Product[];
  onProcessPayment: (method: PaymentMethod, amount: number, items: any[]) => Promise<void>;
  isProcessing: boolean;
}

const PDV: React.FC<PDVProps> = ({ products, onProcessPayment, isProcessing }) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todas', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);

  const handlePayment = async (method: PaymentMethod) => {
    if (cart.length === 0) return;
    await onProcessPayment(method, total, cart);
    setCart([]);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      {/* Products Selection */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Buscar produto por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs uppercase tracking-widest text-slate-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all text-left flex flex-col group"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-600"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <h4 className="font-black text-slate-900 leading-tight mb-1">{product.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{product.sku}</p>
              <div className="mt-auto flex justify-between items-end">
                <span className="text-xl font-black text-indigo-600">R$ {Number(product.price).toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{product.stock} un</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart and Checkout */}
      <div className="w-[400px] flex flex-col gap-6">
        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Carrinho de Vendas</h3>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Itens selecionados</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                <p className="font-black text-xs uppercase tracking-widest">Carrinho Vazio</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="flex gap-4 group">
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-900 text-sm leading-tight">{item.product.name}</h5>
                    <p className="text-xs font-bold text-indigo-600">R$ {Number(item.product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                      </button>
                      <span className="w-8 text-center font-black text-xs text-slate-700">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between items-end mb-8">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">R$ {total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handlePayment(PaymentMethod.CREDIT)}
                className="py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-50"
              >
                Cartão Crédito
              </button>
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handlePayment(PaymentMethod.DEBIT)}
                className="py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-700 hover:border-indigo-600 hover:text-indigo-600 transition-all disabled:opacity-50"
              >
                Cartão Débito
              </button>
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={() => handlePayment(PaymentMethod.PIX)}
                className="col-span-2 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Processando...' : 'Pagar com PIX'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDV;
