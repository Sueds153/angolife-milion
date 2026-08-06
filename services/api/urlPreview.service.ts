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
    let url = targetUrl.trim();
    if (!url) return null;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // ── Step 1: Build baseline result from domain parsing + thum.io screenshot ──
    // This always works and is the guaranteed fallback.
    let companyName = 'Parceiro';
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '').split('.')[0];
      companyName = domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      // Invalid URL — keep default company name
    }

    // thum.io expects the raw URL in the path (no encodeURIComponent)
    const screenshotUrl = `https://image.thum.io/get/width/1200/crop/628/${url}`;

    const baseResult: UrlMetadata = {
      title: `Publicidade ${companyName}`,
      companyName,
      imageUrl: screenshotUrl,
    };

    // ── Step 2: Try Microlink for richer metadata (title, OG image, publisher) ──
    // Wrapped in its own try-catch so any network/CORS failure falls back gracefully.
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(
        `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (response.ok) {
        const json = await response.json();
        if (json.status === 'success' && json.data) {
          const d = json.data;
          const publisher = d.publisher || companyName;

          return {
            title: d.title || baseResult.title,
            companyName: publisher,
            imageUrl: d.image?.url || screenshotUrl,
            description: d.description || '',
            logoUrl: d.logo?.url || d.icon?.url || '',
          };
        }
      }
    } catch {
      // Microlink failed (CORS, timeout, network) — fall through to baseResult
    }

    // Always return at least the domain-based fallback
    return baseResult;
  }
};
