/**
 * Helper to handle video formats, YouTube/Vimeo embeds, and media fallbacks
 */

export const VideoUtils = {
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

  /**
   * Helper component to render video media (HTML5 video or YouTube/Vimeo iframe)
   */
  getEmbedUrl(url?: string): { isEmbed: boolean; embedUrl: string | null } {
    if (!url) return { isEmbed: false, embedUrl: null };
    if (this.isYouTubeUrl(url)) {
      return { isEmbed: true, embedUrl: this.getYouTubeEmbedUrl(url) };
    }
    if (this.isVimeoUrl(url)) {
      return { isEmbed: true, embedUrl: this.getVimeoEmbedUrl(url) };
    }
    return { isEmbed: false, embedUrl: url };
  }
};
