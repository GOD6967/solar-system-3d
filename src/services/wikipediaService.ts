export interface WikipediaSummary {
  title: string;
  displayTitle: string;
  description?: string;
  extract: string;
  extractHtml?: string;
  thumbnailUrl?: string;
  originalImageUrl?: string;
  desktopUrl: string;
  timestamp?: string;
}

class WikipediaService {
  private cache = new Map<string, WikipediaSummary>();
  private pendingRequests = new Map<string, Promise<WikipediaSummary | null>>();

  /**
   * Fetch live summary from Wikipedia REST API with caching and error resilience
   */
  async getSummary(wikipediaTitle: string): Promise<WikipediaSummary | null> {
    if (!wikipediaTitle) return null;

    const key = wikipediaTitle.toLowerCase();
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const requestPromise = (async () => {
      try {
        const encoded = encodeURIComponent(wikipediaTitle);
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn(`Wikipedia API response not OK (${response.status}) for ${wikipediaTitle}`);
          return null;
        }

        const data = await response.json();

        const summary: WikipediaSummary = {
          title: data.title || wikipediaTitle,
          displayTitle: data.titles?.display || data.displaytitle || data.title || wikipediaTitle,
          description: data.description,
          extract: data.extract || 'No article extract available.',
          extractHtml: data.extract_html,
          thumbnailUrl: data.thumbnail?.source,
          originalImageUrl: data.originalimage?.source,
          desktopUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
          timestamp: data.timestamp
        };

        this.cache.set(key, summary);
        return summary;
      } catch (err) {
        console.warn(`Failed to fetch Wikipedia data for ${wikipediaTitle}:`, err);
        return null;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }
}

export const wikipediaService = new WikipediaService();
