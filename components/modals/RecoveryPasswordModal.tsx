import React, { useState } from 'react';
import { X, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { AuthService } from '../../services/core/auth.service';
import { useScrollLock } from '../../hooks/useScrollLock';
import { useAppStore } from '../../store/useAppStore';

export const RecoveryPasswordModal: React.FC = () => {
  const { passwordRecovery, setPasswordRecovery } = useAppStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useScrollLock(passwordRecovery);

  if (!passwordRecovery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('As palavras-passe não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await AuthService.updatePassword(newPassword);
      if (error) {
        setErrorMsg(error.message || 'Erro ao atualizar a palavra-passe.');
      } else {
        setPasswordRecovery(false);
        setNewPassword('');
        setConfirmPassword('');
        alert('Palavra-passe atualizada com sucesso. Já podes entrar com a nova palavra-passe.');
      }
    } catch {
      setErrorMsg('Ocorreu um erro inesperado. Verifique a sua ligação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-orange-500/30 my-auto">
        <button
          onClick={() => setPasswordRecovery(false)}
          title="Fechar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8 pb-0 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 mb-4 border border-orange-500/20">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Definir Nova Palavra-Passe
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Escolhe uma nova palavra-passe para a tua conta Angolife.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-center font-medium animate-fade-in">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest text-[10px] font-bold">Nova Palavra-Passe</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest text-[10px] font-bold">Confirmar Palavra-Passe</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                placeholder="Repete a nova palavra-passe"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Atualizar Palavra-Passe'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
