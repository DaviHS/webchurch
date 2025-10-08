// lib/youtube.ts
import { google } from 'googleapis';

class YouTubeService {
  private youtube: any;

  constructor() {
    // Configure com sua API Key do YouTube Data API v3
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  // Extrai o ID do vídeo da URL do YouTube
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]{11})/,
      /youtube\.com\/embed\/([^?]{11})/,
      /youtube\.com\/v\/([^?]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Adiciona vídeo à playlist
  async addToPlaylist(videoId: string, playlistId: string): Promise<boolean> {
    try {
      await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId,
            },
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar à playlist do YouTube:', error);
      return false;
    }
  }

  // Busca vídeo no YouTube pelo título e artista
  async searchVideo(title: string, artist?: string): Promise<string | null> {
    try {
      const query = artist ? `${title} ${artist}` : title;
      
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: ['video'],
        maxResults: 1,
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id.videoId;
      }
      return null;
    } catch (error) {
      console.error('Erro na busca do YouTube:', error);
      return null;
    }
  }
}

export const youtubeService = new YouTubeService();