import React from 'react';
import { Lock } from 'lucide-react';

interface LockedOverlayProps {
  title: string;
  onRequireAuth: () => void;
}

export const LockedOverlay: React.FC<LockedOverlayProps> = ({ title, onRequireAuth }) => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-[2rem] p-6 text-center shadow-2xl">
    <Lock size={40} className="text-orange-500 mb-4" />
    <h4 className="text-white font-black uppercase text-xl mb-2">{title}</h4>
    <p className="text-slate-300 text-sm mb-6 max-w-[200px]">Crie uma conta gratuita para aceder a estas ferramentas.</p>
    <button 
      onClick={onRequireAuth} 
      className="bg-orange-500 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
    >
      Entrar agora
    </button>
  </div>
);
