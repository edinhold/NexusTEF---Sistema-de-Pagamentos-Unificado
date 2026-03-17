
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, trendUp, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-slate-500 font-semibold mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
