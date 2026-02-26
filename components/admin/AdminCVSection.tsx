
import React from 'react';
import { Crown, RefreshCw, Check, X, User, Phone, Mail, Clock } from 'lucide-react';

interface CVSubscription {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
}

interface AdminCVSectionProps {
  cvSubscriptions: CVSubscription[];
  isLoadingCvSubs: boolean;
  loadCvSubscriptions: () => void;
  handleApproveCvSub: (id: string, userId: string) => void;
  handleRejectCvSub: (id: string) => void;
}

export const AdminCVSection: React.FC<AdminCVSectionProps> = ({
  cvSubscriptions,
  isLoadingCvSubs,
  loadCvSubscriptions,
  handleApproveCvSub,
  handleRejectCvSub
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-orange-500/10 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 stack-narrow">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Crown size={24} />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase">Validar CVs</h3>
            <p className="text-xs text-slate-500">{cvSubscriptions.length} registos encontrados.</p>
          </div>
        </div>
        <button
          onClick={loadCvSubscriptions}
          className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-brand-gold transition-all"
          title="Sincronizar Subscrições"
        >
          <RefreshCw size={20} className={isLoadingCvSubs ? 'animate-spin' : ''} />
        </button>
      </div>

      {cvSubscriptions.length === 0 && !isLoadingCvSubs ? (
        <div className="py-20 text-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-orange-500/20">
          <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Sem solicitações de CV pendentes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cvSubscriptions.map((sub) => (
            <div key={sub.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-orange-500/10 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <User size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">{sub.full_name}</h4>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${sub.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {sub.status === 'pending' ? 'Pendente' : 'Ativo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Phone size={14} className="text-orange-500" /> {sub.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail size={14} className="text-orange-500" /> {sub.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <Clock size={14} /> Solicitado em {new Date(sub.created_at).toLocaleDateString('pt-AO')}
                </div>
              </div>

              {sub.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApproveCvSub(sub.id, sub.user_id)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> Aprovar
                  </button>
                  <button
                    onClick={() => handleRejectCvSub(sub.id)}
                    title="Rejeitar Solicitação"
                    className="px-4 bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95 border border-slate-200 dark:border-white/5"
                  >

                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
