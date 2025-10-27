#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Music MCP Server
class MusicMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'music-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.currentPlaylist = [];
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 50;
    this.repeatMode = 'none'; // 'none', 'one', 'all'
    this.shuffleMode = false;

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'play_song',
            description: 'Play a specific song by name, artist, or search query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Song name, artist, or search query (e.g., "Bohemian Rhapsody", "Queen", "classic rock")',
                },
                artist: {
                  type: 'string',
                  description: 'Optional: Specific artist name',
                },
                genre: {
                  type: 'string',
                  description: 'Optional: Music genre (e.g., "rock", "pop", "jazz", "classical")',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'play_playlist',
            description: 'Play a playlist or create a new one with multiple songs',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Playlist name or "create new" to create a new playlist',
                },
                songs: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of song names or search queries for the playlist',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'control_music',
            description: 'Control music playback (play, pause, stop, next, previous, volume)',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['play', 'pause', 'stop', 'next', 'previous', 'volume', 'seek'],
                  description: 'Control action to perform',
                },
                value: {
                  type: 'number',
                  description: 'For volume: 0-100, for seek: position in seconds',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'search_music',
            description: 'Search for songs, artists, albums, or genres',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for music',
                },
                type: {
                  type: 'string',
                  enum: ['song', 'artist', 'album', 'genre', 'all'],
                  description: 'Type of music to search for',
                  default: 'all',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_now_playing',
            description: 'Get information about the currently playing song and player status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'set_repeat_mode',
            description: 'Set repeat mode for music playback',
            inputSchema: {
              type: 'object',
              properties: {
                mode: {
                  type: 'string',
                  enum: ['none', 'one', 'all'],
                  description: 'Repeat mode: none (no repeat), one (repeat current song), all (repeat playlist)',
                },
              },
              required: ['mode'],
            },
          },
          {
            name: 'toggle_shuffle',
            description: 'Toggle shuffle mode on/off',
            inputSchema: {
              type: 'object',
              properties: {
                enabled: {
                  type: 'boolean',
                  description: 'Whether to enable shuffle mode',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'play_song':
            return await this.playSong(args);
          case 'play_playlist':
            return await this.playPlaylist(args);
          case 'control_music':
            return await this.controlMusic(args);
          case 'search_music':
            return await this.searchMusic(args);
          case 'get_now_playing':
            return await this.getNowPlaying(args);
          case 'set_repeat_mode':
            return await this.setRepeatMode(args);
          case 'toggle_shuffle':
            return await this.toggleShuffle(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async playSong(args) {
    const { query, artist, genre } = args;
    
    try {
      // Mock music database
      const musicDatabase = [
        {
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          album: 'A Night at the Opera',
          genre: 'Rock',
          duration: 355,
          year: 1975,
          url: 'mock://queen-bohemian-rhapsody.mp3'
        },
        {
          title: 'Imagine',
          artist: 'John Lennon',
          album: 'Imagine',
          genre: 'Rock',
          duration: 183,
          year: 1971,
          url: 'mock://john-lennon-imagine.mp3'
        },
        {
          title: 'Billie Jean',
          artist: 'Michael Jackson',
          album: 'Thriller',
          genre: 'Pop',
          duration: 294,
          year: 1982,
          url: 'mock://michael-jackson-billie-jean.mp3'
        },
        {
          title: 'Hotel California',
          artist: 'Eagles',
          album: 'Hotel California',
          genre: 'Rock',
          duration: 391,
          year: 1976,
          url: 'mock://eagles-hotel-california.mp3'
        },
        {
          title: 'Sweet Child O\' Mine',
          artist: 'Guns N\' Roses',
          album: 'Appetite for Destruction',
          genre: 'Rock',
          duration: 356,
          year: 1987,
          url: 'mock://guns-n-roses-sweet-child.mp3'
        }
      ];

      // Search for matching songs
      let results = musicDatabase.filter(song => {
        const queryLower = query.toLowerCase();
        const matchesQuery = song.title.toLowerCase().includes(queryLower) ||
                           song.artist.toLowerCase().includes(queryLower);
        
        const matchesArtist = !artist || song.artist.toLowerCase().includes(artist.toLowerCase());
        const matchesGenre = !genre || song.genre.toLowerCase().includes(genre.toLowerCase());
        
        return matchesQuery && matchesArtist && matchesGenre;
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🎵 No songs found matching "${query}". Try a different search term.`,
            },
          ],
        };
      }

      // Play the first matching song
      const song = results[0];
      this.currentTrack = song;
      this.isPlaying = true;

      let result = `🎵 Now Playing: "${song.title}" by ${song.artist}\n`;
      result += `📀 Album: ${song.album} (${song.year})\n`;
      result += `🎼 Genre: ${song.genre}\n`;
      result += `⏱️ Duration: ${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}\n`;
      result += `🔊 Volume: ${this.volume}%\n`;
      result += `🔄 Repeat: ${this.repeatMode}\n`;
      result += `🔀 Shuffle: ${this.shuffleMode ? 'ON' : 'OFF'}\n\n`;

      if (results.length > 1) {
        result += `💡 Found ${results.length - 1} more matching songs. Use "search_music" to see all results.`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to play song: ${error.message}`);
    }
  }

  async playPlaylist(args) {
    const { name, songs } = args;
    
    try {
      if (name === 'create new' || !songs) {
        return {
          content: [
            {
              type: 'text',
              text: '🎵 To create a playlist, provide both "name" and "songs" array. Example: {"name": "My Playlist", "songs": ["Bohemian Rhapsody", "Imagine", "Billie Jean"]}',
            },
          ],
        };
      }

      // Create playlist
      this.currentPlaylist = songs.map(songName => ({
        title: songName,
        artist: 'Various Artists',
        album: 'Playlist',
        genre: 'Mixed',
        duration: 240,
        year: 2024,
        url: `mock://playlist-${songName.toLowerCase().replace(/\s+/g, '-')}.mp3`
      }));

      this.currentTrack = this.currentPlaylist[0];
      this.isPlaying = true;

      let result = `🎵 Playing Playlist: "${name}"\n`;
      result += `📋 ${this.currentPlaylist.length} songs\n\n`;
      result += `🎶 Now Playing: "${this.currentTrack.title}"\n\n`;
      result += `📝 Playlist:\n`;
      this.currentPlaylist.forEach((song, index) => {
        result += `${index + 1}. ${song.title}\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to play playlist: ${error.message}`);
    }
  }

  async controlMusic(args) {
    const { action, value } = args;
    
    try {
      let result = '';
      
      switch (action) {
        case 'play':
          this.isPlaying = true;
          result = `▶️ Music resumed`;
          if (this.currentTrack) {
            result += ` - Now playing: "${this.currentTrack.title}" by ${this.currentTrack.artist}`;
          }
          break;
          
        case 'pause':
          this.isPlaying = false;
          result = `⏸️ Music paused`;
          break;
          
        case 'stop':
          this.isPlaying = false;
          this.currentTrack = null;
          result = `⏹️ Music stopped`;
          break;
          
        case 'next':
          if (this.currentPlaylist.length > 0) {
            const currentIndex = this.currentPlaylist.findIndex(song => song === this.currentTrack);
            const nextIndex = (currentIndex + 1) % this.currentPlaylist.length;
            this.currentTrack = this.currentPlaylist[nextIndex];
            result = `⏭️ Next track: "${this.currentTrack.title}" by ${this.currentTrack.artist}`;
          } else {
            result = `⏭️ No playlist loaded`;
          }
          break;
          
        case 'previous':
          if (this.currentPlaylist.length > 0) {
            const currentIndex = this.currentPlaylist.findIndex(song => song === this.currentTrack);
            const prevIndex = currentIndex === 0 ? this.currentPlaylist.length - 1 : currentIndex - 1;
            this.currentTrack = this.currentPlaylist[prevIndex];
            result = `⏮️ Previous track: "${this.currentTrack.title}" by ${this.currentTrack.artist}`;
          } else {
            result = `⏮️ No playlist loaded`;
          }
          break;
          
        case 'volume':
          if (value !== undefined && value >= 0 && value <= 100) {
            this.volume = value;
            result = `🔊 Volume set to ${this.volume}%`;
          } else {
            result = `🔊 Current volume: ${this.volume}% (use value 0-100 to change)`;
          }
          break;
          
        case 'seek':
          if (value !== undefined) {
            result = `⏰ Seeked to ${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
          } else {
            result = `⏰ Use repeat action with value parameter to seek to specific time in seconds`;
          }
          break;
          
        default:
          result = `❓ Unknown action: ${action}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to control music: ${error.message}`);
    }
  }

  async searchMusic(args) {
    const { query, type = 'all', limit = 10 } = args;
    
    try {
      const musicDatabase = [
        { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', genre: 'Rock' },
        { title: 'Imagine', artist: 'John Lennon', album: 'Imagine', genre: 'Rock' },
        { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller', genre: 'Pop' },
        { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', genre: 'Rock' },
        { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', album: 'Appetite for Destruction', genre: 'Rock' },
        { title: 'Like a Rolling Stone', artist: 'Bob Dylan', album: 'Highway 61 Revisited', genre: 'Folk Rock' },
        { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind', genre: 'Grunge' },
        { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', genre: 'Rock' },
        { title: 'Purple Rain', artist: 'Prince', album: 'Purple Rain', genre: 'Pop Rock' },
        { title: 'Born to Run', artist: 'Bruce Springsteen', album: 'Born to Run', genre: 'Rock' }
      ];

      const queryLower = query.toLowerCase();
      let results = musicDatabase.filter(item => {
        switch (type) {
          case 'song':
            return item.title.toLowerCase().includes(queryLower);
          case 'artist':
            return item.artist.toLowerCase().includes(queryLower);
          case 'album':
            return item.album.toLowerCase().includes(queryLower);
          case 'genre':
            return item.genre.toLowerCase().includes(queryLower);
          default:
            return item.title.toLowerCase().includes(queryLower) ||
                   item.artist.toLowerCase().includes(queryLower) ||
                   item.album.toLowerCase().includes(queryLower) ||
                   item.genre.toLowerCase().includes(queryLower);
        }
      }).slice(0, limit);

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 No results found for "${query}" in ${type} search.`,
            },
          ],
        };
      }

      let result = `🔍 Search results for "${query}" (${type}):\n\n`;
      results.forEach((item, index) => {
        result += `${index + 1}. 🎵 ${item.title}\n`;
        result += `   👤 Artist: ${item.artist}\n`;
        result += `   💿 Album: ${item.album}\n`;
        result += `   🎼 Genre: ${item.genre}\n\n`;
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search music: ${error.message}`);
    }
  }

  async getNowPlaying(args) {
    try {
      if (!this.currentTrack) {
        return {
          content: [
            {
              type: 'text',
              text: '🎵 No music currently playing. Use "play_song" to start playing music.',
            },
          ],
        };
      }

      let result = `🎵 Now Playing:\n`;
      result += `🎶 Track: "${this.currentTrack.title}"\n`;
      result += `👤 Artist: ${this.currentTrack.artist}\n`;
      result += `💿 Album: ${this.currentTrack.album}\n`;
      result += `🎼 Genre: ${this.currentTrack.genre}\n`;
      result += `⏱️ Duration: ${Math.floor(this.currentTrack.duration / 60)}:${(this.currentTrack.duration % 60).toString().padStart(2, '0')}\n\n`;
      
      result += `🎛️ Player Status:\n`;
      result += `▶️ Playing: ${this.isPlaying ? 'YES' : 'NO'}\n`;
      result += `🔊 Volume: ${this.volume}%\n`;
      result += `🔄 Repeat: ${this.repeatMode}\n`;
      result += `🔀 Shuffle: ${this.shuffleMode ? 'ON' : 'OFF'}\n`;
      
      if (this.currentPlaylist.length > 0) {
        result += `📋 Playlist: ${this.currentPlaylist.length} songs\n`;
        const currentIndex = this.currentPlaylist.findIndex(song => song === this.currentTrack);
        result += `📍 Position: ${currentIndex + 1}/${this.currentPlaylist.length}`;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get now playing info: ${error.message}`);
    }
  }

  async setRepeatMode(args) {
    const { mode } = args;
    
    try {
      this.repeatMode = mode;
      
      let result = `🔄 Repeat mode set to: `;
      switch (mode) {
        case 'none':
          result += 'None (no repeat)';
          break;
        case 'one':
          result += 'One (repeat current song)';
          break;
        case 'all':
          result += 'All (repeat playlist)';
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set repeat mode: ${error.message}`);
    }
  }

  async toggleShuffle(args) {
    const { enabled } = args;
    
    try {
      if (enabled !== undefined) {
        this.shuffleMode = enabled;
      } else {
        this.shuffleMode = !this.shuffleMode;
      }

      return {
        content: [
          {
            type: 'text',
            text: `🔀 Shuffle mode: ${this.shuffleMode ? 'ON' : 'OFF'}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to toggle shuffle: ${error.message}`);
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Music MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new MusicMCPServer();
server.run().catch(console.error);
