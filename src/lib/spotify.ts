class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  // Obter access token
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: process.env.SPOTIFY_REFRESH_TOKEN!
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Spotify API Error: ${data.error} - ${data.error_description}`);
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      return this.accessToken!;
    } catch (error) {
      console.error('❌ Erro ao obter access token do Spotify:', error);
      throw error;
    }
  }

  // Fazer requisições autenticadas
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAccessToken();
    
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Spotify API Error: ${response.status} - ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // Extrair ID do track/artist/playlist da URL
  extractId(url: string): { type: 'track' | 'artist' | 'playlist' | 'album'; id: string } | null {
    const patterns = [
      // Track
      /spotify\.com\/track\/([a-zA-Z0-9]{22})/,
      /spotify:track:([a-zA-Z0-9]{22})/,
      // Artist
      /spotify\.com\/artist\/([a-zA-Z0-9]{22})/,
      /spotify:artist:([a-zA-Z0-9]{22})/,
      // Playlist
      /spotify\.com\/playlist\/([a-zA-Z0-9]{22})/,
      /spotify:playlist:([a-zA-Z0-9]{22})/,
      // Album
      /spotify\.com\/album\/([a-zA-Z0-9]{22})/,
      /spotify:album:([a-zA-Z0-9]{22})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        let type: 'track' | 'artist' | 'playlist' | 'album' = 'track';
        
        if (pattern.source.includes('artist')) type = 'artist';
        else if (pattern.source.includes('playlist')) type = 'playlist';
        else if (pattern.source.includes('album')) type = 'album';
        
        return { type, id: match[1] };
      }
    }
    
    return null;
  }

  // Buscar música
  async searchTrack(title: string, artist?: string): Promise<{
    id: string;
    name: string;
    artists: string[];
    duration_ms: number;
    preview_url: string | null;
    external_urls: { spotify: string };
    album: { name: string; images: Array<{ url: string }> };
  } | null> {
    try {
      const query = artist ? `${title} artist:${artist}` : title;
      const data = await this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=track&limit=1`);

      if (data.tracks?.items?.[0]) {
        return data.tracks.items[0];
      }
      return null;
    } catch (error) {
      console.error('Erro na busca do Spotify:', error);
      return null;
    }
  }

  // Verificar se música está na playlist
  async isTrackInPlaylist(trackId: string, playlistId?: string): Promise<boolean> {
    try {
      const targetPlaylistId = playlistId || process.env.SPOTIFY_PLAYLIST_ID;
      const data = await this.makeRequest(`/playlists/${targetPlaylistId}/tracks?limit=100`);
      
      return data.items.some((item: any) => item.track?.id === trackId);
    } catch (error) {
      console.error('Erro ao verificar playlist do Spotify:', error);
      return false;
    }
  }

  // Adicionar música à playlist
  async addToPlaylist(trackId: string, playlistId?: string): Promise<boolean> {
    try {
      const targetPlaylistId = playlistId || process.env.SPOTIFY_PLAYLIST_ID;
      const alreadyInPlaylist = await this.isTrackInPlaylist(trackId, targetPlaylistId);
      
      if (alreadyInPlaylist) {
        console.log(`ℹ️ Música ${trackId} já está na playlist, ignorando...`);
        return true;
      }

      await this.makeRequest(`/playlists/${targetPlaylistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
          uris: [`spotify:track:${trackId}`]
        })
      });

      console.log(`✅ Música ${trackId} adicionada à playlist do Spotify`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar à playlist do Spotify:', error);
      return false;
    }
  }

  // Remover música da playlist
  async removeFromPlaylist(trackId: string, playlistId?: string): Promise<boolean> {
    try {
      const targetPlaylistId = playlistId || process.env.SPOTIFY_PLAYLIST_ID;
      const alreadyInPlaylist = await this.isTrackInPlaylist(trackId, targetPlaylistId);
      
      if (!alreadyInPlaylist) {
        console.log(`ℹ️ Música ${trackId} não está na playlist, ignorando remoção...`);
        return true;
      }

      await this.makeRequest(`/playlists/${targetPlaylistId}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({
          tracks: [{ uri: `spotify:track:${trackId}` }]
        })
      });

      console.log(`🗑️ Música ${trackId} removida da playlist do Spotify`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao remover música da playlist do Spotify:', error);
      return false;
    }
  }

  // Obter informações de uma música
  async getTrack(trackId: string) {
    try {
      return await this.makeRequest(`/tracks/${trackId}`);
    } catch (error) {
      console.error('Erro ao obter dados do track:', error);
      return null;
    }
  }

  // Obter informações do artista
  async getArtist(artistId: string) {
    try {
      return await this.makeRequest(`/artists/${artistId}`);
    } catch (error) {
      console.error('Erro ao obter dados do artista:', error);
      return null;
    }
  }
}

export const spotifyService = new SpotifyService();