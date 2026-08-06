/**
 * Helper to handle video formats: YouTube, Vimeo, Facebook, TikTok, Instagram, and LinkedIn embeds
 */

export const VideoUtils = {
  // ── 1. YouTube ──
  isYouTubeUrl(url?: string): boolean {
    if (!url) return false;
    return /youtube\.com|youtu\.be/i.test(url);
  },

  getYouTubeEmbedUrl(url?: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match
      ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1`
      : null;
  },

  // ── 2. Vimeo ──
  isVimeoUrl(url?: string): boolean {
    if (!url) return false;
    return /vimeo\.com/i.test(url);
  },

  getVimeoEmbedUrl(url?: string): string | null {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match
      ? `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`
      : null;
  },

  // ── 3. Facebook (Videos, Reels, Watch) ──
  isFacebookUrl(url?: string): boolean {
    if (!url) return false;
    return /facebook\.com|fb\.watch|fb\.com/i.test(url);
  },

  getFacebookEmbedUrl(url?: string): string | null {
    if (!url) return null;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=true&muted=true`;
  },

  // ── 4. TikTok ──
  isTikTokUrl(url?: string): boolean {
    if (!url) return false;
    return /tiktok\.com/i.test(url);
  },

  getTikTokEmbedUrl(url?: string): string | null {
    if (!url) return null;
    const match = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/|v\/)?(\d+)/);
    if (match && match[1]) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    // Fallback embed for TikTok URLs without direct ID match
    return `https://www.tiktok.com/embed/v2/?url=${encodeURIComponent(url)}`;
  },

  // ── 5. Instagram (Reels & Posts) ──
  isInstagramUrl(url?: string): boolean {
    if (!url) return false;
    return /instagram\.com|instagr\.am/i.test(url);
  },

  getInstagramEmbedUrl(url?: string): string | null {
    if (!url) return null;
    const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed`;
    }
    // Fallback adding /embed
    const cleanUrl = url.split('?')[0].replace(/\/$/, '');
    return `${cleanUrl}/embed`;
  },

  // ── 6. LinkedIn ──
  isLinkedInUrl(url?: string): boolean {
    if (!url) return false;
    return /linkedin\.com/i.test(url);
  },

  getLinkedInEmbedUrl(url?: string): string | null {
    if (!url) return null;
    const match = url.match(/(urn:li:(?:ugcPost|share|activity|article):[\d]+)/);
    if (match && match[1]) {
      return `https://www.linkedin.com/embed/feed/update/${match[1]}`;
    }
    if (url.includes('/embed/')) return url;
    return null;
  },

  /**
   * Helper component to render video media across all major social platforms
   */
  getEmbedUrl(url?: string): { isEmbed: boolean; embedUrl: string | null } {
    if (!url) return { isEmbed: false, embedUrl: null };

    if (this.isYouTubeUrl(url)) {
      return { isEmbed: true, embedUrl: this.getYouTubeEmbedUrl(url) };
    }
    if (this.isVimeoUrl(url)) {
      return { isEmbed: true, embedUrl: this.getVimeoEmbedUrl(url) };
    }
    if (this.isFacebookUrl(url)) {
      return { isEmbed: true, embedUrl: this.getFacebookEmbedUrl(url) };
    }
    if (this.isTikTokUrl(url)) {
      return { isEmbed: true, embedUrl: this.getTikTokEmbedUrl(url) };
    }
    if (this.isInstagramUrl(url)) {
      return { isEmbed: true, embedUrl: this.getInstagramEmbedUrl(url) };
    }
    if (this.isLinkedInUrl(url)) {
      const linkedInEmbed = this.getLinkedInEmbedUrl(url);
      if (linkedInEmbed) return { isEmbed: true, embedUrl: linkedInEmbed };
    }

    return { isEmbed: false, embedUrl: url };
  }
};

