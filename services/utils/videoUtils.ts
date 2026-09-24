/**
 * Helper to handle video formats: YouTube, Vimeo, Facebook, TikTok, Instagram, and LinkedIn embeds
 * Hosts are validated via URL parsing (no unanchored regex) to block lookalike domains.
 */

function safeUrl(url?: string): URL | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u;
  } catch {
    return null;
  }
}

function hostIs(u: URL, domain: string): boolean {
  const h = u.hostname.toLowerCase();
  return h === domain || h.endsWith(`.${domain}`);
}

export const VideoUtils = {
  // ── 1. YouTube ──
  isYouTubeUrl(url?: string): boolean {
    const u = safeUrl(url);
    return !!u && (hostIs(u, 'youtube.com') || hostIs(u, 'youtu.be'));
  },

  getYouTubeEmbedUrl(url?: string): string | null {
    if (!url || !this.isYouTubeUrl(url)) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match
      ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}&controls=0&playsinline=1`
      : null;
  },

  // ── 2. Vimeo ──
  isVimeoUrl(url?: string): boolean {
    const u = safeUrl(url);
    return !!u && hostIs(u, 'vimeo.com');
  },

  getVimeoEmbedUrl(url?: string): string | null {
    if (!url || !this.isVimeoUrl(url)) return null;
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match
      ? `https://player.vimeo.com/video/${match[1]}?autoplay=1&muted=1&loop=1&background=1`
      : null;
  },

  // ── 3. Facebook (Videos, Reels, Watch) ──
  isFacebookUrl(url?: string): boolean {
    const u = safeUrl(url);
    if (!u) return false;
    return hostIs(u, 'facebook.com') || hostIs(u, 'fb.watch') || hostIs(u, 'fb.com');
  },

  getFacebookEmbedUrl(url?: string): string | null {
    if (!url || !this.isFacebookUrl(url)) return null;
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=true&muted=true`;
  },

  // ── 4. TikTok ──
  isTikTokUrl(url?: string): boolean {
    const u = safeUrl(url);
    return !!u && hostIs(u, 'tiktok.com');
  },

  getTikTokEmbedUrl(url?: string): string | null {
    if (!url || !this.isTikTokUrl(url)) return null;
    const match = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/|v\/)?(\d+)/);
    if (match && match[1]) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    return `https://www.tiktok.com/embed/v2/?url=${encodeURIComponent(url)}`;
  },

  // ── 5. Instagram (Reels & Posts) ──
  isInstagramUrl(url?: string): boolean {
    const u = safeUrl(url);
    if (!u) return false;
    return hostIs(u, 'instagram.com') || hostIs(u, 'instagr.am');
  },

  getInstagramEmbedUrl(url?: string): string | null {
    if (!url || !this.isInstagramUrl(url)) return null;
    const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed`;
    }
    const u = safeUrl(url);
    if (!u) return null;
    const cleanUrl = `${u.origin}${u.pathname.replace(/\/$/, '')}`;
    return `${cleanUrl}/embed`;
  },

  // ── 6. LinkedIn ──
  isLinkedInUrl(url?: string): boolean {
    const u = safeUrl(url);
    return !!u && hostIs(u, 'linkedin.com');
  },

  getLinkedInEmbedUrl(url?: string): string | null {
    if (!url || !this.isLinkedInUrl(url)) return null;
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
