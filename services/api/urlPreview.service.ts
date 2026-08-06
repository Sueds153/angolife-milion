/**
 * URL Metadata & Web Preview Service
 * Fetches Open Graph images, title, publisher, and live screenshots for any website URL
 */

export interface UrlMetadata {
  title?: string;
  companyName?: string;
  imageUrl?: string;
  description?: string;
  logoUrl?: string;
}

export const UrlPreviewService = {
  fetchMetadata: async (targetUrl: string): Promise<UrlMetadata | null> => {
    try {
      let url = targetUrl.trim();
      if (!url) return null;

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Microlink API for metadata extraction
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success' && json.data) {
          const d = json.data;
          
          let companyName = d.publisher;
          if (!companyName) {
            try {
              const domain = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
              companyName = domain.charAt(0).toUpperCase() + domain.slice(1);
            } catch {
              companyName = 'Parceiro Resolve.AO';
            }
          }

          const fallbackScreenshot = `https://image.thum.io/get/width/1200/crop/600/${url}`;

          return {
            title: d.title || `Anúncio ${companyName}`,
            companyName: companyName,
            imageUrl: d.image?.url || fallbackScreenshot,
            description: d.description || '',
            logoUrl: d.logo?.url || d.icon?.url || '',
          };
        }
      }

      // Fallback domain parser & screenshot service
      const domain = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      const companyName = domain.charAt(0).toUpperCase() + domain.slice(1);

      return {
        title: `Publicidade ${companyName}`,
        companyName: companyName,
        imageUrl: `https://image.thum.io/get/width/1200/crop/600/${url}`,
      };
    } catch (err) {
      console.error('[UrlPreviewService] Error:', err);
      return null;
    }
  }
};
