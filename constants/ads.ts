
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
  
  // Banners de Parceiros (Seção de Anúncios) — fallback usado apenas quando a
  // base de dados não tem banners de parceiros ativos.
  partnerBanners: [
    {
      id: "partner-1",
      companyName: "Resolve.AO",
      mediaType: "image" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80",
      videoUrl: "",
      link: "https://wa.me/244929423278",
      title: "Promove a tua empresa",
      isActive: true
    },
    {
      id: "partner-2",
      companyName: "Resolve.AO",
      mediaType: "image" as "image" | "video",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80",
      videoUrl: "",
      link: "/cambio",
      title: "Câmbio em tempo real",
      isActive: true
    }
  ],

  // Configurações do Google AdSense
  googleAds: {
    enabled: false,
    client: "ca-pub-XXXXXXXXXXXXXXXX", // Substituir pelo ID real do Google Ads
    slots: {
      homeHero: "XXXXXXXXXX",
      homeFooter: "XXXXXXXXXX",
      jobsList: "XXXXXXXXXX"
    }
  }
};
