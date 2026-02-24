import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronRight, ChevronLeft, Sparkles, Plus, Trash2, User, Briefcase, GraduationCap, Award, FileText, Lock, Star, Check, Zap, Crown, CreditCard, Calendar, Clock, X } from 'lucide-react';
import { GeminiService } from '../services/gemini';
import { SupabaseService } from '../services/supabaseService';
import { CVData, CVExperience, CVEducation, UserProfile } from '../types';
import { CVTemplateSelector, CVTemplateType, TEMPLATE_OPTIONS } from '../components/cv-templates/CVTemplateSelector';

interface CVBuilderPageProps {
  isAuthenticated: boolean;
  userProfile?: UserProfile;
  onRequireAuth: () => void;
  onUpgrade: (plan: 'pack3' | 'monthly' | 'yearly') => void;
  onDecrementCredit?: () => void;
}

const initialCV: CVData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  summary: '',
  experiences: [],
  education: [],
  skills: []
};

export const CVBuilderPage: React.FC<CVBuilderPageProps> = ({ isAuthenticated, userProfile, onRequireAuth, onUpgrade, onDecrementCredit }) => {
  const [step, setStep] = useState(1);
  const [cv, setCv] = useState<CVData>({ ...initialCV, photoUrl: '' });
  const [isImproving, setIsImproving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pack3' | 'monthly' | 'yearly'>('monthly');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plans' | 'checkout' | 'pending'>('plans');
  const [showNotification, setShowNotification] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CVTemplateType>('classic');
  const [educationFirst, setEducationFirst] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strengthRef = useRef<HTMLDivElement>(null);

  // --- CV STRENGTH METER ---
  const cvStrength = (() => {
    let score = 0;
    if (cv.fullName.trim()) score += 10;
    if (cv.email.trim()) score += 5;
    if (cv.phone.trim()) score += 5;
    if (cv.location.trim()) score += 5;
    if (cv.summary.trim().length > 50) score += 15;
    if (cv.experiences.length > 0) score += 20;
    if (cv.experiences.length > 1) score += 10;
    if (cv.experiences.some(e => e.description.trim().length > 30)) score += 10;
    if (cv.education.length > 0) score += 10;
    if (cv.skills.length >= 3) score += 10;
    return score;
  })();

  useEffect(() => {
    if (strengthRef.current) {
      strengthRef.current.style.setProperty('--progress-width', `${cvStrength}%`);
    }
  }, [cvStrength]);

  const strengthLabel = cvStrength < 30 ? 'Fraco' : cvStrength < 60 ? 'Médio' : cvStrength < 85 ? 'Bom' : 'Excelente';
  const strengthColor = cvStrength < 30 ? 'bg-red-500' : cvStrength < 60 ? 'bg-amber-500' : cvStrength < 85 ? 'bg-brand-gold' : 'bg-emerald-500';

  // Check Access
  const hasCredits = (userProfile?.cvCredits || 0) > 0;
  const isPremiumValid = userProfile?.isAdmin || (userProfile?.isPremium && (userProfile.premiumExpiry || 0) > Date.now());
  const canDownload = isAuthenticated && (isPremiumValid || hasCredits);

  // Helper for Input Changes
  const updateField = (field: keyof CVData, value: any) => {
    setCv(prev => ({ ...prev, [field]: value }));
  };

  // AI Helper Functions
  const improveText = async (text: string, type: 'summary' | 'description', expId?: string) => {
    if (!isAuthenticated) { onRequireAuth(); return; }
    if (!text) return;

    setIsImproving(true);
    const optimized = await GeminiService.improveCVContent(text, type);

    if (type === 'summary') {
      updateField('summary', optimized);
    } else if (type === 'description' && expId) {
      const newExp = cv.experiences.map(e => e.id === expId ? { ...e, description: optimized } : e);
      updateField('experiences', newExp);
    }
    setIsImproving(false);
  };

  const addExperience = () => {
    const newExp: CVExperience = {
      id: Date.now().toString(),
      role: '', company: '', startDate: '', endDate: '', isCurrent: false, description: ''
    };
    updateField('experiences', [...cv.experiences, newExp]);
  };

  const removeExperience = (id: string) => {
    updateField('experiences', cv.experiences.filter(e => e.id !== id));
  };

  const updateExperience = (id: string, field: keyof CVExperience, value: any) => {
    const newExp = cv.experiences.map(e => e.id === id ? { ...e, [field]: value } : e);
    updateField('experiences', newExp);
  };

  const addEducation = () => {
    const newEdu: CVEducation = { id: Date.now().toString(), degree: '', school: '', year: '' };
    updateField('education', [...cv.education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof CVEducation, value: any) => {
    const newEdu = cv.education.map(e => e.id === id ? { ...e, [field]: value } : e);
    updateField('education', newEdu);
  };

  const handleSkillAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val && !cv.skills.includes(val)) {
        updateField('skills', [...cv.skills, val]);
        e.currentTarget.value = '';
      }
    }
  };

  const handlePrint = () => {
    if (!isAuthenticated) { onRequireAuth(); return; }

    if (canDownload) {
      if (!isPremiumValid && hasCredits && onDecrementCredit) {
        onDecrementCredit();
        alert(`1 Crédito usado. Restam ${userProfile!.cvCredits - 1} créditos.`);
      }
      window.print();
    } else {
      setShowPaywall(true);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('photoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleSubmitPayment = async () => {
    if (!isAuthenticated) { onRequireAuth(); return; }
    if (!receiptFile) { alert('Por favor, carregue o comprovativo de pagamento.'); return; }
    if (!userProfile?.id) { alert('Erro: utilizador não identificado. Por favor, volte a fazer login.'); return; }

    setIsUploadingReceipt(true);
    try {
      // 1. Upload receipt to storage
      const publicUrl = await SupabaseService.uploadReceipt(receiptFile);
      console.log('[Payment] Upload URL:', publicUrl);

      if (!publicUrl) throw new Error('Erro no upload do ficheiro');

      // 2. Create subscription record
      const success = await SupabaseService.submitCVSubscription(
        userProfile.id,
        selectedPlan,
        publicUrl
      );
      console.log('[Payment] Subscription result:', success);

      if (success) {
        setPaymentStep('pending');
        alert('Comprovativo enviado com sucesso! Aguarde a aprovação do Admin.');
      } else {
        throw new Error('Erro ao registar subscrição');
      }
    } catch (error: any) {
      console.error('[Payment] Error:', error);
      alert(`Erro ao processar pagamento: ${error?.message || 'Tente novamente.'}`);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // --- STEPS RENDERING ---
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-xl font-black text-brand-gold uppercase tracking-tight flex items-center gap-2">
        <User size={20} /> Informações Pessoais
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome Completo</label>
          <input
            className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none"
            value={cv.fullName}
            onChange={e => updateField('fullName', e.target.value)}
            placeholder="Ex: João Manuel"
            aria-label="Nome Completo"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cargo / Título Profissional</label>
          <input
            className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none"
            placeholder="Ex: Engenheiro Civil Sénior"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Foto de Perfil</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center overflow-hidden">
              {cv.photoUrl ? (
                <img src={cv.photoUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="text-slate-300" size={32} />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="bg-brand-gold/10 text-brand-gold px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-brand-gold/20"
            >
              Escolher Foto
            </label>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</label>
          <input
            className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none"
            value={cv.email}
            onChange={e => updateField('email', e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Telefone</label>
          <input
            className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none"
            value={cv.phone}
            onChange={e => updateField('phone', e.target.value)}
            placeholder="+244 9XX XXX XXX"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localização</label>
          <input
            className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none"
            value={cv.location}
            onChange={e => updateField('location', e.target.value)}
            placeholder="Luanda, Angola"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumo Profissional</label>
            <button
              onClick={() => improveText(cv.summary, 'summary')}
              disabled={isImproving || !cv.summary}
              className="text-[9px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-1 hover:text-amber-600 disabled:opacity-50"
            >
              <Sparkles size={12} /> {isImproving ? 'Otimizando...' : 'Melhorar com IA'}
            </button>
          </div>
          <textarea
            className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none h-32 resize-none"
            value={cv.summary}
            onChange={e => updateField('summary', e.target.value)}
            placeholder="Escreva um breve resumo sobre a sua carreira..."
          />
          <p className="text-[10px] text-slate-400 mt-1">💡 Dica: 3-4 frases, mencione anos de experiência, área de especialização e o valor que traz. Ex: 'Gestor com 5 anos em logística, especializado em redução de custos operacionais.'</p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumo Profissional Final</label>
        <button
          onClick={() => improveText(cv.summary, 'summary')}
          disabled={isImproving || !cv.summary}
          className="text-[9px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-1 hover:text-amber-600 disabled:opacity-50"
        >
          <Sparkles size={12} /> {isImproving ? 'Otimizando...' : 'Melhorar com IA'}
        </button>
      </div>
      <textarea
        className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none h-64 resize-none"
        value={cv.summary}
        onChange={e => updateField('summary', e.target.value)}
        placeholder="Escreva um breve resumo sobre a sua carreira..."
      />
      <p className="text-[10px] text-slate-400">💡 Dica: Mencione anos de experiência, sector e o principal valor que entrega ao empregador.</p>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-brand-gold uppercase tracking-tight flex items-center gap-2">
          <Briefcase size={20} /> Experiência
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEducationFirst(f => !f)}
            title={educationFirst ? 'Educação está antes. Clique para colocar depois.' : 'Experiência está antes. Clique para inverter.'}
            className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-gold transition-colors border border-dashed border-slate-200 dark:border-white/10 px-2 py-1 rounded-lg"
          >
            <ChevronLeft size={12} /><ChevronRight size={12} /> Ordenar
          </button>
          <button onClick={addExperience} className="bg-brand-gold text-white p-2 rounded-full" aria-label="Adicionar Experiência"><Plus size={20} /></button>
        </div>
      </div>

      {cv.experiences.length === 0 && (
        <div className="text-center p-8 bg-slate-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-orange-500/20">
          <p className="text-slate-400 text-sm font-bold">Nenhuma experiência adicionada</p>
        </div>
      )}

      {cv.experiences.map((exp, idx) => (
        <div key={exp.id} className="bg-white dark:bg-slate-900 border gold-border-subtle p-6 rounded-2xl space-y-4 shadow-sm relative">
          <button onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500" aria-label="Remover Experiência"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Cargo (Ex: Gerente)"
              className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg outline-none font-bold"
              value={exp.role}
              onChange={e => updateExperience(exp.id, 'role', e.target.value)}
              aria-label="Cargo"
            />
            <input placeholder="Empresa" className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg outline-none font-bold" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} aria-label="Nome da Empresa" />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="MM/AAAA"
                aria-label="Data de Início"
                className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg w-full outline-none text-xs"
                value={exp.startDate}
                onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                maxLength={7}
              />
              <input
                type="text"
                placeholder="MM/AAAA (Fim)"
                aria-label="Data de Fim"
                disabled={exp.isCurrent}
                className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg w-full outline-none text-xs disabled:opacity-50"
                value={exp.endDate}
                onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                maxLength={7}
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={exp.isCurrent} onChange={e => updateExperience(exp.id, 'isCurrent', e.target.checked)} id={`curr-${exp.id}`} className="accent-brand-gold w-4 h-4" />
              <label htmlFor={`curr-${exp.id}`} className="text-xs font-bold uppercase tracking-widest text-slate-500">Trabalho Atual</label>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição das Atividades</label>
              <button
                onClick={() => improveText(exp.description, 'description', exp.id)}
                disabled={isImproving || !exp.description}
                className="text-[9px] font-black uppercase tracking-widest text-brand-gold flex items-center gap-1 hover:text-amber-600 disabled:opacity-50"
              >
                <Sparkles size={12} /> {isImproving ? 'IA a escrever...' : 'Melhorar com IA'}
              </button>
            </div>
            <textarea
              className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-3 rounded-xl outline-none h-24 resize-none"
              placeholder="Descreva suas responsabilidades e conquistas..."
              value={exp.description}
              onChange={e => updateExperience(exp.id, 'description', e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">💡 Use verbos de ação: 'Gerenciei', 'Reduzi', 'Implementei'. Inclua números e resultados sempre que possível.</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-brand-gold uppercase tracking-tight flex items-center gap-2">
          <GraduationCap size={20} /> Educação
        </h3>
        <button onClick={addEducation} className="bg-brand-gold text-white p-2 rounded-full" aria-label="Adicionar Educação"><Plus size={20} /></button>
      </div>
      {cv.education.map((edu) => (
        <div key={edu.id} className="bg-white dark:bg-slate-900 border gold-border-subtle p-6 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          <button onClick={() => updateField('education', cv.education.filter(e => e.id !== edu.id))} className="absolute top-4 right-4 text-slate-400 hover:text-red-500" aria-label="Remover Educação"><Trash2 size={18} /></button>
          <input
            placeholder="Curso / Grau (Ex: Licenciatura)"
            className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg outline-none font-bold"
            value={edu.degree}
            onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
            aria-label="Grau Académico"
          />
          <input
            placeholder="Instituição"
            className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg outline-none font-bold"
            value={edu.school}
            onChange={e => updateEducation(edu.id, 'school', e.target.value)}
            aria-label="Instituição de Ensino"
          />
          <input
            placeholder="Ano de Conclusão"
            className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg outline-none font-bold"
            value={edu.year}
            onChange={e => updateEducation(edu.id, 'year', e.target.value)}
            aria-label="Ano de Conclusão"
          />
        </div>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-xl font-black text-brand-gold uppercase tracking-tight flex items-center gap-2">
        <Award size={20} /> Habilidades
      </h3>
      <div className="bg-white dark:bg-slate-900 border gold-border-subtle p-6 rounded-2xl space-y-4">
        <input
          className="w-full bg-slate-50 dark:bg-white/5 border gold-border-subtle p-4 rounded-xl outline-none"
          placeholder="Digite uma habilidade e pressione ENTER (Ex: Gestão de Projetos)"
          onKeyDown={handleSkillAdd}
          aria-label="Adicionar nova habilidade"
        />
        <div className="flex flex-wrap gap-2">
          {cv.skills.map((skill, i) => (
            <span key={i} className="bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2">
              {skill} <button onClick={() => updateField('skills', cv.skills.filter(s => s !== skill))} aria-label={`Remover habilidade ${skill}`}><CloseIcon size={14} /></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  // --- PREVIEW RENDER (CSS FOR PRINT) ---
  const PreviewCV = () => (
    <div id="cv-preview" className="relative print:m-0 print:p-0">
      <CVTemplateSelector type={selectedTemplate} cv={cv} educationFirst={educationFirst} />

      {/* Watermark for non-premium */}
      {!isPremiumValid && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-45 select-none overflow-hidden">
          <span className="text-8xl font-black uppercase tracking-[2em]">ANGOLIFE</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20 relative">
      <div className="flex flex-col md:flex-row gap-8 print:hidden">
        {/* LEFT SIDE: BUILDER FORM */}
        <div className="w-full md:w-1/2 space-y-6 transition-all duration-500">
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-xl gold-border-subtle">
            <div className="flex justify-between items-center mb-8 border-b gold-border-b-subtle pb-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Criador de CV</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                Passo <span className="text-brand-gold text-lg">{step}</span> / 5
              </div>
            </div>

            {/* CV STRENGTH METER */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border gold-border-subtle">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Força do CV</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${strengthColor.replace('bg-', 'text-')}`}>{strengthLabel} · {cvStrength}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  ref={strengthRef}
                  className={`h-full rounded-full transition-all duration-700 ease-out progress-bar-fill ${strengthColor}`}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] text-slate-400">Nome</span>
                <span className="text-[9px] text-slate-400">Email/Tel</span>
                <span className="text-[9px] text-slate-400">Resumo</span>
                <span className="text-[9px] text-slate-400">Exp.</span>
                <span className="text-[9px] text-slate-400">Skills</span>
              </div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}

            <div className="flex justify-between mt-10 pt-6 border-t gold-border-t-subtle">
              <button
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
              >
                <ChevronLeft size={16} /> Voltar
              </button>

              {step < 5 ? (
                <button
                  onClick={() => setStep(s => Math.min(5, s + 1))}
                  className="bg-brand-gold text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-amber-600"
                >
                  Próximo <ChevronRight size={16} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2 hidden md:block">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estado da conta</div>
                    {isPremiumValid && <div className="text-xs font-black text-emerald-500 uppercase">Premium Ativo</div>}
                    {!isPremiumValid && hasCredits && <div className="text-xs font-black text-brand-gold uppercase">{userProfile?.cvCredits} Créditos</div>}
                    {!canDownload && <div className="text-xs font-black text-red-500 uppercase">Sem Acesso</div>}
                  </div>
                  <button
                    onClick={handlePrint}
                    className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-emerald-600"
                  >
                    <Download size={16} /> Baixar PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI TIPS CARD */}
          <div className="bg-slate-950 text-white p-8 rounded-[2rem] gold-border-subtle relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="flex items-center gap-2 text-brand-gold font-black uppercase tracking-widest text-sm mb-4">
                <Sparkles size={14} /> Dica de Ouro Angolife
              </h4>
              <p className="text-sm font-medium leading-relaxed text-slate-300">
                {step === 1 && "Use um email profissional (nome.sobrenome@email.com). Evite emails informais. No resumo, foque no valor que pode trazer à empresa."}
                {step === 2 && "Em vez de listar tarefas, liste resultados. Use a IA para transformar 'Vendi produtos' em 'Gerenciei vendas resultando em 20% de aumento de receita'."}
                {step === 3 && "Coloque a educação mais recente primeiro. Se tem experiência, não precisa detalhar o ensino médio."}
                {step === 4 && "Foque em competências técnicas (Hard Skills) relevantes para a vaga. Soft skills são melhores demonstradas na entrevista."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LIVE PREVIEW */}
        <div className="w-full md:w-1/2">
          <div className="sticky top-24">
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Selecione o Estilo do CV</span>
                {!isAuthenticated && (
                  <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase tracking-widest"><Lock size={10} /> Login necessário</span>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TEMPLATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedTemplate(opt.id as CVTemplateType)}
                    className={`flex flex-col items-center justify-center p-4 rounded-[1.5rem] border-2 transition-all duration-300 ${selectedTemplate === opt.id ? 'bg-brand-gold border-brand-gold text-white shadow-xl shadow-amber-500/20 scale-105' : 'bg-white dark:bg-white/5 border-transparent text-slate-500 hover:border-brand-gold/50'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${selectedTemplate === opt.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10'}`}>
                      {opt.id === 'classic' && <FileText size={20} />}
                      {opt.id === 'modern' && <Briefcase size={20} />}
                      {opt.id === 'minimalist' && <Sparkles size={20} />}
                      {opt.id === 'technical' && <Zap size={20} />}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest">{opt.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pré-visualização a4</span>
            </div>

            {/* A4 PAPER SIMULATION */}
            <div className="flex justify-center bg-slate-100 dark:bg-slate-800/50 p-6 md:p-10 rounded-[2.5rem] border gold-border-subtle overflow-hidden relative">
              <div className="w-full max-w-[500px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white origin-top transition-transform duration-500 hover:scale-[1.02] relative">
                <div className="aspect-[1/1.414] overflow-hidden select-none">
                  <div className="w-[210mm] scale-[0.25] sm:scale-[0.35] md:scale-[0.45] lg:scale-[0.43] origin-top-left p-0 m-0">
                    <PreviewCV />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION OVERLAY */}
        {showPaywall && !canDownload && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md"></div>

              <div className="relative w-full max-w-4xl mx-auto z-10">
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-gold text-white mb-6 shadow-xl shadow-amber-500/20">
                    <Crown size={32} />
                  </div>
                  <button
                    onClick={() => setShowPaywall(false)}
                    className="absolute top-0 right-0 p-4 text-slate-500 hover:text-white transition-colors"
                    title="Fechar"
                    aria-label="Fechar janela"
                  >
                    <X size={24} />
                  </button>
                  <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4">
                    Desbloqueie o seu <span className="text-brand-gold">Potencial</span>
                  </h2>
                  <p className="text-slate-400 text-lg font-medium max-w-xl mx-auto">
                    Escolha o plano ideal para a sua carreira. Acesso imediato ao nosso criador de CV com inteligência artificial.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* PLAN 1: BRONZE */}
                  <div
                    onClick={() => setSelectedPlan('pack3')}
                    className={`bg-slate-900 border-2 rounded-3xl p-6 cursor-pointer transition-all hover:scale-105 ${selectedPlan === 'pack3' ? 'border-brand-gold shadow-2xl scale-105 bg-slate-800' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-800 rounded-2xl text-slate-400"><FileText size={24} /></div>
                      {selectedPlan === 'pack3' && <div className="bg-brand-gold text-white text-[10px] font-black uppercase px-2 py-1 rounded">Selecionado</div>}
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Plano Bronze</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-white">199,99</span>
                      <span className="text-brand-gold font-bold text-sm">Kz</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
                      Ideal para quem precisa de atualizações pontuais. "Libertar 2 CVs Rápidos".
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-300"><Check size={14} className="text-emerald-500" /> 2 Downloads de CV</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-300"><Check size={14} className="text-emerald-500" /> Modelos Premium</li>
                    </ul>
                  </div>

                  {/* PLAN 2: PRATA (POPULAR) */}
                  <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`bg-slate-900 border-2 rounded-3xl p-6 cursor-pointer transition-all hover:scale-105 relative overflow-hidden ${selectedPlan === 'monthly' ? 'border-brand-gold shadow-2xl scale-105 bg-slate-800 ring-2 ring-brand-gold/20' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="absolute top-0 right-0 bg-brand-gold text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl">Mais Popular</div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-brand-gold rounded-2xl text-white shadow-lg"><Calendar size={24} /></div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Plano Prata</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-white">999,99</span>
                      <span className="text-brand-gold font-bold text-sm">Kz</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
                      "Acesso Ilimitado por 30 Dias". Perfeito para quem está ativamente à procura.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-300"><Check size={14} className="text-emerald-500" /> Downloads Ilimitados</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-300"><Check size={14} className="text-emerald-500" /> Suporte VIP</li>
                    </ul>
                  </div>

                  {/* PLAN 3: OURO */}
                  <div
                    onClick={() => setSelectedPlan('yearly')}
                    className={`bg-slate-900 border-2 rounded-3xl p-6 cursor-pointer transition-all hover:scale-105 ${selectedPlan === 'yearly' ? 'border-brand-gold shadow-2xl scale-105 bg-slate-800' : 'border-slate-800 hover:border-slate-700'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-slate-800 rounded-2xl text-slate-400"><Crown size={24} /></div>
                      <div className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded ml-2">Melhor Valor</div>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Plano Ouro</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black text-white">1.999,99</span>
                      <span className="text-brand-gold font-bold text-sm">Kz</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
                      "Acesso Vitalício + Modelos VIP". O melhor investimento para sua carreira.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-300"><Check size={14} className="text-emerald-500" /> Acesso Vitalício</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-300"><Check size={14} className="text-emerald-500" /> Modelos VIP</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-10 flex flex-col items-center">
                  {paymentStep === 'plans' && (
                    <button
                      onClick={() => setPaymentStep('checkout')}
                      className="w-full md:w-auto min-w-[300px] bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                      <CreditCard size={20} />
                      <span>Continuar para Pagamento</span>
                    </button>
                  )}

                  {paymentStep === 'checkout' && (
                    <div className="bg-slate-800/80 p-6 rounded-[2rem] border gold-border-subtle w-full max-w-xl mx-auto space-y-6">
                      <div className="text-center">
                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Dados para Pagamento</h4>
                        <p className="text-slate-400 text-xs">Efectue a transferência para os dados abaixo</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase">Entidade</div>
                          <div className="text-xl font-black text-brand-gold">10116</div>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                          <div className="text-[10px] font-black text-slate-500 uppercase">Referência</div>
                          <div className="text-xl font-black text-brand-gold">921967122</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carregar Comprovativo de Pagamento</label>
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleReceiptUpload}
                            className="hidden"
                            id="receipt-upload"
                          />
                          <label
                            htmlFor="receipt-upload"
                            className="w-full bg-slate-900 border-2 border-dashed border-slate-700 p-8 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-gold transition-colors"
                          >
                            <Zap size={32} className="text-slate-500" />
                            <span className="text-xs font-bold text-slate-400">
                              {receiptFile ? receiptFile.name : "Clique para carregar (JPG, PNG ou PDF)"}
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={handleSubmitPayment}
                          disabled={isUploadingReceipt || !receiptFile}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                          {isUploadingReceipt ? "Enviando..." : "Finalizar Pedido"}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <button className="bg-slate-700 text-white py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 flex items-center justify-center gap-2">
                            <FileText size={14} /> Passo a Passo
                          </button>
                          <button className="bg-slate-700 text-white py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 flex items-center justify-center gap-2">
                            <Sparkles size={14} /> Suporte
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentStep === 'pending' && (
                    <div className="bg-slate-800/80 p-8 rounded-[2rem] border border-brand-gold/50 text-center max-w-md mx-auto">
                      <div className="w-16 h-16 bg-brand-gold/20 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock size={32} />
                      </div>
                      <h4 className="text-white font-black uppercase tracking-widest text-lg mb-2">Aguardando Aprovação</h4>
                      <p className="text-slate-400 text-sm font-medium mb-6">
                        Recebemos o seu comprovativo. O nosso administrador irá validar o pagamento em breve.
                      </p>
                      <button
                        onClick={() => setPaymentStep('plans')}
                        className="text-brand-gold font-black uppercase text-xs tracking-widest hover:underline"
                      >
                        Voltar aos Planos
                      </button>
                    </div>
                  )}
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-4">
                    Pagamento Seguro Via Multicaixa Express
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PRINT STYLES - Ensures only the CV is printed */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cv-preview, #cv-preview * {
            visibility: visible;
          }
          #cv-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 40px !important;
            box-shadow: none;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
};

// Simple CloseIcon replacement for the Skills section
const CloseIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
