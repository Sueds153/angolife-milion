
import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
  initialMode?: 'login' | 'register';
  onOpenLegal: (type: 'privacy' | 'terms' | 'data') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onOpenLegal, initialMode = 'login' }) => {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setIsRegister(initialMode === 'register');
    setShowPassword(false);
    setErrorMsg('');
    setFullName('');
    setIsLoading(false);
    setTermsAccepted(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password || (isRegister && !fullName)) {
      setErrorMsg("Por favor preencha todos os campos.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Por favor, insira um e-mail válido.');
      return;
    }

    if (isRegister && !termsAccepted) {
      setErrorMsg('Deves aceitar os Termos e a Política de Privacidade.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        const { error } = await SupabaseService.auth.signUp(email, password, fullName);
        if (error) {
          if (error.message.toLowerCase().includes('rate limit')) {
            setErrorMsg('Limite de tentativas excedido. Por favor, aguarde uns minutos ou desative a Confirmação de Email no Supabase.');
          } else {
            setErrorMsg(error.message || 'Erro ao criar conta. Tente novamente.');
          }
        } else {
          // Success
          onLogin(email);
        }
      } else {
        const { error } = await SupabaseService.auth.signIn(email, password);
        if (error) {
          setErrorMsg('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
        } else {
          // Success
          onLogin(email);
        }
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro inesperado. Verifique a sua ligação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Por favor, introduza o seu e-mail no campo acima primeiro.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await SupabaseService.auth.resetPassword(email);
      if (error) {
        setErrorMsg('Erro ao recuperar senha. Verifique o seu e-mail.');
      } else {
        alert('As instruções de recuperação foram enviadas para o seu e-mail.');
      }
    } catch (err) {
      setErrorMsg('Erro de ligação ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-orange-500/30">
        <button
          onClick={onClose}
          title="Fechar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8 pb-0 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 mb-4 border border-orange-500/20">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isRegister
              ? 'Registe-se para aceder a ferramentas exclusivas.'
              : 'Faça login para continuar a usar o Angolife.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs text-center font-medium animate-fade-in">
              {errorMsg}
            </div>
          )}

          {isRegister && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest text-[10px] font-bold">Nome Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required={isRegister}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest text-[10px] font-bold">E-mail</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                placeholder="exemplo@angolife.ao"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest text-[10px] font-bold">Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full pl-10 pr-12 py-2 bg-white dark:bg-slate-800 border border-orange-500/20 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 transition-all font-medium"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-orange-500 transition-colors"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isRegister && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-semibold text-orange-500 hover:underline mt-1"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}
          </div>

          {isRegister && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-orange-500/10 animate-fade-in group cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
              <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${termsAccepted ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                {termsAccepted && <div className="w-2.5 h-2.5 bg-white rounded-[2px]" />}
              </div>
              <div className="flex-grow">
                <p className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">
                  Aceito os <button type="button" onClick={(e) => { e.stopPropagation(); onOpenLegal('terms'); }} className="text-orange-500 hover:underline">Termos de Uso</button> e a <button type="button" onClick={(e) => { e.stopPropagation(); onOpenLegal('privacy'); }} className="text-orange-500 hover:underline">Política de Privacidade</button>.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-4 gold-border-subtle"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              isRegister ? 'Cadastrar' : 'Entrar'
            )}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 text-center text-sm border-t gold-border-t-subtle">
          <p className="text-slate-500 dark:text-slate-400">
            {isRegister ? 'Já tem conta?' : 'Ainda não tem conta?'}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 font-bold text-orange-500 hover:underline focus:outline-none"
            >
              {isRegister ? 'Fazer Login' : 'Criar Conta'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
