
import React, { useEffect, useState } from 'react';
import {
    ArrowLeft,
    BadgeCheck,
    Eye,
    ThumbsUp,
    Share2,
    MapPin,
    Store,
    Tag,
    Loader2,
    MessageCircle,
    FileText,
} from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { AdBanner } from '../components/AdBanner';
import { ProductDeal, UserProfile } from '../types';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DealDetailPageProps {
    /** Objeto deal completo vindo da lista (funciona para deals AI + Supabase) */
    deal: ProductDeal;
    onBack: () => void;
    user: UserProfile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcSavings(original: number, current: number): number {
    if (!original || original <= 0) return 0;
    return Math.round(((original - current) / original) * 100);
}

function resolveImage(deal: ProductDeal): string {
    return deal.imageUrl || deal.imagePlaceholder || '';
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export const DealDetailPage: React.FC<DealDetailPageProps> = ({ deal: initialDeal, onBack, user }) => {
    // Começa com os dados já disponíveis da lista — zero loading para data básica
    const [deal, setDeal] = useState<ProductDeal>(initialDeal);
    const [enriching, setEnriching] = useState(true);
    const [localViews, setLocalViews] = useState((initialDeal.views ?? 0) + 1);

    // ── Enriquecimento em background: busca dados extra do Supabase ────────────
    useEffect(() => {
        let cancelled = false;

        const enrich = async () => {
            setEnriching(true);

            // Só tenta enriquecer se for um deal do Supabase (IDs reais não começam por 'd')
            const looksLikeAiId = /^d\d+$/.test(initialDeal.id);

            if (!looksLikeAiId) {
                const supabaseData = await SupabaseService.getDealById(initialDeal.id);
                if (!cancelled && supabaseData) {
                    // Merge: mantém o que já temos e substitui apenas os campos que chegaram do Supabase
                    setDeal(prev => ({
                        ...prev,
                        ...supabaseData,
                        // Garante que a descrição exibe sempre algo — usa o que tínhamos se o Supabase vier vazio
                        description: supabaseData.description || prev.description,
                    }));
                    setLocalViews((supabaseData.views ?? 0) + 1);
                }
            }

            if (!cancelled) setEnriching(false);

            // Incrementar views em background (fire & forget)
            if (!looksLikeAiId) {
                SupabaseService.incrementDealViews(initialDeal.id).catch(() => { });
            }
        };

        enrich();
        return () => { cancelled = true; };
    }, [initialDeal.id]);

    // ── Handlers de Ação ───────────────────────────────────────────────────────

    const handleContact = () => {
        const rawPhone = deal.phone || deal.storeNumber;
        if (!rawPhone) return;
        const cleaned = rawPhone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleaned}`, '_blank');
    };

    const handleShare = async () => {
        const shareData = {
            title: deal.title ?? 'Oferta AngoLife',
            text: `${deal.title} por apenas ${deal.discountPrice?.toLocaleString()} Kz em ${deal.store}!`,
            url: window.location.href,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch { /* cancelado */ }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copiado para a área de transferência!');
            } catch { /* silencioso */ }
        }
    };

    const handleMap = () => {
        const query = encodeURIComponent(`${deal.store} ${deal.location}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    // ── Variáveis derivadas ────────────────────────────────────────────────────

    const savings = calcSavings(deal.originalPrice, deal.discountPrice);
    const isVerified = deal.verified || deal.is_admin;
    const phone = deal.phone || deal.storeNumber;
    const heroImage = resolveImage(deal);
    const description = deal.description?.trim();

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="relative flex flex-col min-h-screen pb-[130px] animate-fade-in -mx-4 -mt-6">

            {/* ═══ HERO IMAGE ═══════════════════════════════════════════════════════ */}
            <div className="relative w-full h-64 md:h-80 overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0">

                {heroImage ? (
                    <img
                        src={heroImage}
                        alt={deal.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Tag size={48} className="text-slate-400" />
                    </div>
                )}

                {/* Gradiente */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40 pointer-events-none" />

                {/* Botão Voltar */}
                <button
                    onClick={onBack}
                    aria-label="Voltar à lista de ofertas"
                    className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm text-white p-2.5 rounded-full active:scale-90 transition-all hover:bg-black/70 border border-white/20"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* Badge de desconto */}
                {savings > 0 && (
                    <div className="absolute top-4 right-4 z-10 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-xl shadow-lg">
                        -{savings}%
                    </div>
                )}

                {/* Loja no rodapé da imagem */}
                <div className="absolute bottom-4 left-4 right-4 z-10">
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                            <Store size={14} className="text-white" />
                        </div>
                        <span className="text-white font-black text-sm tracking-tight drop-shadow">
                            {deal.store}
                        </span>
                    </div>
                </div>

            </div>
            {/* fim hero */}

            {/* ═══ CORPO ════════════════════════════════════════════════════════════ */}
            <div className="flex-1 px-4 pt-5 space-y-5">

                {/* Título */}
                <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    {deal.title}
                </h1>

                {/* Selo Verificado */}
                {isVerified && (
                    <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-400/40 dark:border-amber-500/30 rounded-xl px-4 py-2">
                        <BadgeCheck size={16} className="text-amber-500 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-amber-600 dark:text-amber-400 font-black text-[11px] uppercase tracking-widest">
                            Oferta Verificada pela AngoLife
                        </span>
                    </div>
                )}

                {/* ── Bloco Loja & Localização ── */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5 space-y-3">

                    <div className="flex items-center gap-3">
                        <div className="bg-brand-gold/10 p-2.5 rounded-xl flex-shrink-0">
                            <Store size={16} className="text-brand-gold" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loja</p>
                            <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{deal.store}</p>
                        </div>
                    </div>

                    {deal.location && (
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-2.5 rounded-xl flex-shrink-0">
                                <MapPin size={16} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{deal.location}</p>
                            </div>
                        </div>
                    )}

                    {phone && (
                        <button
                            onClick={handleContact}
                            className="w-full flex items-center justify-center gap-2.5 mt-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            <MessageCircle size={16} />
                            Contactar via WhatsApp
                        </button>
                    )}

                </div>

                {/* ── Bloco de Preço ── */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-end justify-between flex-wrap gap-3">

                        <div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                Preço com desconto
                            </p>
                            <p className="text-4xl font-black text-brand-gold leading-none">
                                {deal.discountPrice.toLocaleString()}
                                <span className="text-lg font-bold ml-1">Kz</span>
                            </p>
                            {deal.originalPrice > deal.discountPrice && (
                                <p className="text-sm text-slate-400 line-through font-medium mt-1">
                                    {deal.originalPrice.toLocaleString()} Kz
                                </p>
                            )}
                        </div>

                        {savings > 0 && (
                            <div className="bg-red-500 text-white rounded-2xl px-4 py-2 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Poupas</p>
                                <p className="text-2xl font-black leading-tight">{savings}%</p>
                            </div>
                        )}

                    </div>

                    {/* Contadores */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Eye size={13} />
                            <span className="text-[11px] font-bold">
                                {enriching ? '...' : localViews.toLocaleString()} visualizações
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <ThumbsUp size={13} />
                            <span className="text-[11px] font-bold">{(deal.likes ?? 0).toLocaleString()} útil</span>
                        </div>
                    </div>
                </div>

                {/* Categoria */}
                {deal.category && (
                    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                        <Tag size={12} className="text-slate-500" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                            {deal.category}
                        </span>
                    </div>
                )}

                {/* ── Botões Como Chegar & Partilhar ── */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleMap}
                        className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
                    >
                        <MapPin size={16} />
                        Como Chegar
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 bg-slate-800 dark:bg-white/10 hover:bg-slate-700 dark:hover:bg-white/20 active:scale-95 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border border-white/10"
                    >
                        <Share2 size={16} />
                        Partilhar
                    </button>
                </div>

                {/* ── Secção "Sobre esta oferta" ── */}
                {/* Sempre visível: mostra a descrição existente ou um texto padrão elegante */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText size={15} className="text-brand-gold" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Sobre esta oferta
                        </p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-line">
                        {description
                            ? description
                            : `Oferta imperdível de ${deal.title} na ${deal.store}${deal.location ? `, em ${deal.location}` : ''}. Aproveita enquanto o stock durar!`}
                    </p>
                </div>

            </div>
            {/* fim corpo */}

            {/* ═══ AD BANNER FIXO ═══════════════════════════════════════════════════ */}
            <div className="fixed bottom-[50px] left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[95] bg-white dark:bg-black border-t border-orange-500/10 shadow-2xl print:hidden">
                <AdBanner format="sticky-footer" />
            </div>

        </div>
    );
};
