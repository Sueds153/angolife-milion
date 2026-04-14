
export const PARTNER_ADS = {
  // Banners do Topo (Hero)
  heroBanners: [
    {
      id: "hero-1",
      mediaType: "image" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1600&q=80",
      videoUrl: "",
      link: "/vagas",
      title: "Oportunidades de Ouro"
    },
    {
      id: "hero-2",
      mediaType: "image" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=1600&q=80",
      videoUrl: "",
      link: "/cambio",
      title: "Câmbio Atualizado"
    },
    {
      id: "hero-3",
      mediaType: "image" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1573164574572-cb391716a1b7?w=1600&q=80",
      videoUrl: "",
      link: "/ofertas",
      title: "Ofertas Exclusivas"
    }
  ],
  
  // Banners de Parceiros (Seção de Anúncios)
  partnerBanners: [
    {
      id: "partner-1",
      companyName: "Exemplo Empresa A",
      mediaType: "image" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1600&q=80",
      videoUrl: "",
      link: "https://wa.me/244921967122",
      isActive: true
    },
    {
      id: "partner-2",
      companyName: "Exemplo Empresa B",
      mediaType: "video" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=1600&q=80", // Poster if video
      videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Link de exemplo
      link: "https://wa.me/244921967122",
      isActive: true
    }
  ],

  // Configurações do Google AdSense
  googleAds: {
      enabled: true,
      client: "ca-pub-XXXXXXXXXXXXXXXX", // Substituir pelo ID real do Google Ads
      slots: {
        homeHero: "XXXXXXXXXX",
        homeFooter: "XXXXXXXXXX",
        jobsList: "XXXXXXXXXX"
      }
    }
};

/**
 * Regras operacionais para funcionamento dos anúncios no app.
 * Alterar estes valores impacta a frequência com que os usuários veem anúncios.
 */
export const AD_CONFIG = {
  // Número de cliques em itens (vagas/ofertas) antes de exigir um anúncio premiado
  REWARD_AD_THRESHOLD: 3,
  
  // Duração mínima (segundos) de um anúncio intersticial
  INTERSTITIAL_DURATION: 5,
  
  // Cooldown de segurança (ms) entre anúncios intersticiais automáticos
  INTERSTITIAL_COOLDOWN_MS: 5 * 60 * 1000, // 5 minutos

  // Chance (0 a 1) de exibir um anúncio intersticial em transições de página
  PAGE_TRANSITION_AD_PROBABILITY: 0.4 // 60% chance no-ad, 40% chance ad
};
