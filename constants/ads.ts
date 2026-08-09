
import { PLACEHOLDER_IMAGE } from "./placeholders";

export const PARTNER_ADS = {
  // Banners do Topo (Hero)
  heroBanners: [
    {
      id: "hero-1",
      mediaType: "image" as "image" | "video",
      imageUrl: PLACEHOLDER_IMAGE,
      videoUrl: "",
      link: "/vagas",
      title: "Oportunidades de Ouro"
    },
    {
      id: "hero-2",
      mediaType: "image" as "image" | "video",
      imageUrl: PLACEHOLDER_IMAGE,
      videoUrl: "",
      link: "/cambio",
      title: "Câmbio Atualizado"
    },
    {
      id: "hero-3",
      mediaType: "image" as "image" | "video",
      imageUrl: PLACEHOLDER_IMAGE,
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
      imageUrl: PLACEHOLDER_IMAGE,
      videoUrl: "",
      link: "https://wa.me/244929423278",
      title: "Promove a tua empresa",
      isActive: true
    },
    {
      id: "partner-2",
      companyName: "Resolve.AO",
      mediaType: "image" as "image" | "video",
      imageUrl: PLACEHOLDER_IMAGE,
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
