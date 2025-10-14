import { google } from 'googleapis';

class YouTubeService {
  private youtube: any;
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
    });

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]{11})/,
      /youtube\.com\/embed\/([^?]{11})/,
      /youtube\.com\/v\/([^?]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) return match[1] ?? null;
    }
    
    return null;
  }

  async isVideoInPlaylist(videoId: string, playlistId: string): Promise<boolean> {
    try {
      const response = await this.youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: playlistId,
        videoId: videoId,
        maxResults: 1
      });

      return response.data.items && response.data.items.length > 0;
    } catch (error) {
      console.error('Erro ao verificar playlist:', error);
      return false;
    }
  }

  async addToPlaylist(videoId: string, playlistId: string): Promise<boolean> {
    try {
      const alreadyInPlaylist = await this.isVideoInPlaylist(videoId, playlistId);
      
      if (alreadyInPlaylist) {
        console.log(`ℹ️ Vídeo ${videoId} já está na playlist, ignorando...`);
        return true;
      }

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
      console.log(`✅ Vídeo ${videoId} adicionado à playlist ${playlistId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar à playlist do YouTube:', error);
      return false;
    }
  }

  async searchVideo(title: string, artist?: string): Promise<string | null> {
    try {
      const query = artist ? `${title} ${artist}` : title;
      
      console.log('aqui', query)
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

  async removeFromPlaylist(videoId: string, playlistId: string): Promise<boolean> {
    try {
      const response = await this.youtube.playlistItems.list({
        part: ['id'],
        playlistId: playlistId,
        videoId: videoId,
        maxResults: 1
      });

      if (response.data.items && response.data.items.length > 0) {
        const playlistItemId = response.data.items[0].id;
        
        await this.youtube.playlistItems.delete({
          id: playlistItemId
        });
        
        console.log(`🗑️ Vídeo ${videoId} removido da playlist ${playlistId}`);
        return true;
      }
      
      console.log(`ℹ️ Vídeo ${videoId} não encontrado na playlist para remoção`);
      return false;
    } catch (error) {
      console.error('❌ Erro ao remover vídeo da playlist:', error);
      return false;
    }
  }
}

export const  youtubeService = new YouTubeService();