/**
 * @copyright (c) 2024-2026 AngoLife by Su-Golden. All rights reserved.
 */

export const ServiceUtils = {
  sanitize: (text: string): string => {
    if (!text) return "";
    return text
      .trim()
      .replace(/<[^>]*>?/gm, "") // Remove HTML tags
      .replace(/['";\\]/g, ""); // Remove common escape characters
  },

  mapStatus: (status: string | undefined): "pending" | "published" | "approved" | "rejected" => {
    if (!status) return "pending";
    const s = status.toLowerCase();

    if (s === "publicado" || s === "published" || s === "aprovado" || s === "approved" || s === "premium" || s === "ativo" || s === "active") {
      return "published";
    }

    if (s === "rejeitado" || s === "rejected") {
      return "rejected";
    }

    return "pending";
  },

  formatDescription: (text: string): string[] => {
    if (!text) return [];

    let formatted = text
      // Quebrar antes de "1.", "2." (evitando quebrar coisas como v1.0)
      .replace(/(?:\s|^)(\d+\.)\s/g, '\n\n$1 ')
      // Quebrar antes de "1.1", "1.2"
      .replace(/(?:\s|^)(\d+\.\d+)\s/g, '\n\n$1 ')
      // Quebrar antes de bullets "•" ou "⁃"
      .replace(/\s*([•⁃])\s*/g, '\n• ')
      // Quebrar após ponto final + espaço + Maiúscula (mas apenas se antes houver uma letra/parêntese)
      .replace(/([a-zA-Zçãéíóúâêôáà)]+)\.\s+(?=[A-Z])/g, '$1.\n')
      // Quebrar após fecho de parênteses + espaço + Maiúscula
      .replace(/\)\s+(?=[A-Z])/g, ')\n')
      // Quebrar após dois-pontos + espaço + Maiúscula
      .replace(/([a-zA-Zçãéíóúâêôáà]):\s+(?=[A-Z])/g, '$1:\n')
      // Casos em que falta o ponto antes de um número de secção (ex: "experiência 1.3 Formação")
      .replace(/([a-zA-Zçãéíóúâêôáà])\s+(\d+\.\d+)\s/g, '$1\n\n$2 ')
      .replace(/([a-zA-Zçãéíóúâêôáà])\s+(\d+\.)\s/g, '$1\n\n$2 ')
      // Quebrar blocos excessivamente colados em Letras Maiúsculas (ex: "NOME COMPLETO TELEFONE") se houver indicativos
      .replace(/\s(EMAIL|TELEFONE|CIDADE|LINKEDIN|PORTFÓLIO)\b/gi, '\n$1')
      // Palavras-chave de secções
      .replace(/(Requisitos|Benefícios|Responsabilidades|Perfil|Profile|Requirements|Benefits|Responsibilities|Contacto|Email|Candidaturas?|Localização):\s*/gi, '\n\n$1:\n')
      .trim();

    // Limpar quebras excessivas
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  },

  formatRelativeDate: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Há ${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `Há ${diffInDays} dias`;
    return date.toLocaleDateString('pt-AO');
  }
};
