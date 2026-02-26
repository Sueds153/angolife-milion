
import React from 'react';

export const AdminOverview: React.FC = () => {
  return (
    <div className="bg-slate-50 dark:bg-white/5 p-12 rounded-[3rem] text-center border border-orange-500/10">
      <h3 className="text-xl font-black uppercase mb-4">Bem-vindo ao Painel de Controlo</h3>
      <p className="text-slate-500 text-sm max-w-sm mx-auto">Utilize as abas acima para gerir os diferentes departamentos da AngoLife.</p>
    </div>
  );
};
