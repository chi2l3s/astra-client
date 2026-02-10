export interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: string;
  server_side: string;
  icon_url?: string;
  downloads: number;
  follows: number;
  date_created: string;
  date_modified: string;
  author: string;
}

export const modrinthService = {
  async getProjectVersions(slug: string): Promise<any[]> {
    try {
      const response = await fetch(`https://api.modrinth.com/v2/project/${slug}/version`, {
        headers: {
          'User-Agent': 'AstraClient/1.0.0 (contact@astraclient.com)',
        },
      });
      return await response.json();
    } catch {
      return [];
    }
  },

  async getVersion(versionId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.modrinth.com/v2/version/${versionId}`, {
        headers: {
          'User-Agent': 'AstraClient/1.0.0 (contact@astraclient.com)',
        },
      });
      return await response.json();
    } catch {
      return null;
    }
  },

  async searchProjects(
    query: string = '',
    limit: number = 20,
    offset: number = 0,
    facets: string = '',
    sort: 'relevance' | 'downloads' | 'newest' | 'updated' = 'relevance'
  ): Promise<ModrinthProject[]> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        offset: offset.toString(),
        index: sort,
      });

      if (facets) {
        params.append('facets', facets);
      }

      const response = await fetch(`https://api.modrinth.com/v2/search?${params}`, {
        headers: {
          'User-Agent': 'AstraClient/1.0.0 (contact@astraclient.com)',
        },
      });
      const data = await response.json();
      const hits = Array.isArray(data?.hits) ? data.hits : [];

      return hits.map((hit: any) => ({
        id: hit.project_id,
        slug: hit.slug,
        title: hit.title,
        description: hit.description,
        categories: hit.categories,
        client_side: hit.client_side,
        server_side: hit.server_side,
        icon_url: hit.icon_url,
        downloads: hit.downloads,
        follows: hit.follows,
        date_created: hit.date_created,
        date_modified: hit.date_modified,
        author: hit.author,
      }));
    } catch {
      return [];
    }
  },
};
