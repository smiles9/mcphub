#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Audiobook MCP Server
class AudiobookMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'audiobook-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.currentBook = null;
    this.currentChapter = 1;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.currentPosition = 0; // in seconds
    this.bookmarks = new Map(); // book title -> array of bookmarks
    this.readingProgress = new Map(); // book title -> progress data
    this.readingLists = new Map(); // list name -> array of books
    this.audiobookCache = new Map(); // cache for search results

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
            name: 'play_audiobook',
            description: 'Play a specific audiobook by title, author, or search query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Book title, author, or search query (e.g., "1984", "George Orwell", "dystopian fiction")',
                },
                author: {
                  type: 'string',
                  description: 'Optional: Specific author name',
                },
                genre: {
                  type: 'string',
                  description: 'Optional: Book genre (e.g., "fiction", "non-fiction", "mystery", "sci-fi", "biography")',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'play_chapter',
            description: 'Play a specific chapter of the current audiobook',
            inputSchema: {
              type: 'object',
              properties: {
                chapter: {
                  type: 'number',
                  description: 'Chapter number to play',
                },
                book_title: {
                  type: 'string',
                  description: 'Optional: Book title if not currently loaded',
                },
              },
              required: ['chapter'],
            },
          },
          {
            name: 'control_playback',
            description: 'Control audiobook playback (play, pause, stop, next chapter, previous chapter, speed, seek)',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['play', 'pause', 'stop', 'next_chapter', 'previous_chapter', 'speed', 'seek'],
                  description: 'Control action to perform',
                },
                value: {
                  type: 'number',
                  description: 'For speed: 0.5-3.0, for seek: position in seconds',
                },
              },
              required: ['action'],
            },
          },
          {
            name: 'search_audiobooks',
            description: 'Search for audiobooks by title, author, genre, or keywords',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for audiobooks',
                },
                type: {
                  type: 'string',
                  enum: ['title', 'author', 'genre', 'all'],
                  description: 'Type of search to perform',
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
            name: 'get_current_book',
            description: 'Get information about the currently playing audiobook and reading progress',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'add_bookmark',
            description: 'Add a bookmark at the current position or specific time',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Bookmark name or description',
                },
                position: {
                  type: 'number',
                  description: 'Optional: Position in seconds (if not provided, uses current position)',
                },
                chapter: {
                  type: 'number',
                  description: 'Optional: Chapter number',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'list_bookmarks',
            description: 'List all bookmarks for the current audiobook',
            inputSchema: {
              type: 'object',
              properties: {
                book_title: {
                  type: 'string',
                  description: 'Optional: Book title (if not provided, uses current book)',
                },
              },
            },
          },
          {
            name: 'set_reading_speed',
            description: 'Set the playback speed for audiobook reading',
            inputSchema: {
              type: 'object',
              properties: {
                speed: {
                  type: 'number',
                  description: 'Playback speed (0.5 = half speed, 1.0 = normal, 2.0 = double speed, max 3.0)',
                },
              },
              required: ['speed'],
            },
          },
          {
            name: 'get_reading_progress',
            description: 'Get detailed reading progress and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                book_title: {
                  type: 'string',
                  description: 'Optional: Book title (if not provided, uses current book)',
                },
              },
            },
          },
          {
            name: 'create_reading_list',
            description: 'Create a reading list with multiple audiobooks',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Reading list name',
                },
                books: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of book titles or search queries',
                },
              },
              required: ['name', 'books'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'play_audiobook':
            return await this.playAudiobook(args);
          case 'play_chapter':
            return await this.playChapter(args);
          case 'control_playback':
            return await this.controlPlayback(args);
          case 'search_audiobooks':
            return await this.searchAudiobooks(args);
          case 'get_current_book':
            return await this.getCurrentBook(args);
          case 'add_bookmark':
            return await this.addBookmark(args);
          case 'list_bookmarks':
            return await this.listBookmarks(args);
          case 'set_reading_speed':
            return await this.setReadingSpeed(args);
          case 'get_reading_progress':
            return await this.getReadingProgress(args);
          case 'create_reading_list':
            return await this.createReadingList(args);
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

  // Real audiobook integration methods
  async searchLibriVox(query, limit = 10) {
    try {
      const cacheKey = `librivox_${query}_${limit}`;
      if (this.audiobookCache.has(cacheKey)) {
        return this.audiobookCache.get(cacheKey);
      }

      const response = await fetch(`https://librivox.org/api/feed/audiobooks/?search=${encodeURIComponent(query)}&format=json&limit=${limit}`);
      const data = await response.json();
      
      const books = data.books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.authors?.map(author => `${author.first_name} ${author.last_name}`).join(', ') || 'Unknown Author',
        narrator: book.readers?.map(reader => reader.display_name).join(', ') || 'Unknown Narrator',
        genre: book.genres?.map(genre => genre.name).join(', ') || 'Unknown Genre',
        duration: this.parseDuration(book.totaltime),
        chapters: book.sections?.length || 1,
        year: book.copyright_year || 'Unknown',
        description: book.description || 'No description available',
        language: book.language || 'English',
        url: book.url_librivox,
        source: 'LibriVox',
        cover: book.url_cover_image,
        sections: book.sections || []
      }));

      this.audiobookCache.set(cacheKey, books);
      return books;
    } catch (error) {
      console.error('LibriVox search error:', error);
      return [];
    }
  }

  async searchInternetArchive(query, limit = 10) {
    try {
      const cacheKey = `archive_${query}_${limit}`;
      if (this.audiobookCache.has(cacheKey)) {
        return this.audiobookCache.get(cacheKey);
      }

      const response = await fetch(`https://archive.org/advancedsearch.php?q=mediatype:audio+AND+collection:librivoxaudio+AND+${encodeURIComponent(query)}&output=json&rows=${limit}`);
      const data = await response.json();
      
      const books = data.response.docs.map(book => ({
        id: book.identifier,
        title: book.title,
        author: book.creator || 'Unknown Author',
        narrator: book.contributor || 'Unknown Narrator',
        genre: 'Public Domain',
        duration: this.parseDuration(book.runtime),
        chapters: book.files?.filter(file => file.endsWith('.mp3')).length || 1,
        year: book.date || 'Unknown',
        description: book.description || 'No description available',
        language: book.language || 'English',
        url: `https://archive.org/download/${book.identifier}`,
        source: 'Internet Archive',
        cover: book.coverimage || null,
        sections: book.files?.filter(file => file.endsWith('.mp3')) || []
      }));

      this.audiobookCache.set(cacheKey, books);
      return books;
    } catch (error) {
      console.error('Internet Archive search error:', error);
      return [];
    }
  }

  async searchOpenLibrary(query, limit = 10) {
    try {
      const cacheKey = `openlib_${query}_${limit}`;
      if (this.audiobookCache.has(cacheKey)) {
        return this.audiobookCache.get(cacheKey);
      }

      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&mediaType=audiobook&limit=${limit}`);
      const data = await response.json();
      
      const books = data.docs.map(book => ({
        id: book.key,
        title: book.title,
        author: book.author_name?.join(', ') || 'Unknown Author',
        narrator: 'Unknown Narrator',
        genre: book.subject?.join(', ') || 'Unknown Genre',
        duration: 0, // Not available in Open Library
        chapters: 1,
        year: book.first_publish_year || 'Unknown',
        description: book.first_sentence?.[0] || 'No description available',
        language: book.language?.[0] || 'English',
        url: `https://openlibrary.org${book.key}`,
        source: 'Open Library',
        cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : null,
        sections: []
      }));

      this.audiobookCache.set(cacheKey, books);
      return books;
    } catch (error) {
      console.error('Open Library search error:', error);
      return [];
    }
  }

  parseDuration(timeString) {
    if (!timeString) return 0;
    
    // Handle formats like "11:30:45" or "11h 30m 45s"
    const timeRegex = /(\d+):(\d+):(\d+)/;
    const match = timeString.match(timeRegex);
    
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    // Handle formats like "11h 30m 45s"
    const parts = timeString.match(/(\d+)h|(\d+)m|(\d+)s/g);
    if (parts) {
      let totalSeconds = 0;
      parts.forEach(part => {
        if (part.includes('h')) totalSeconds += parseInt(part) * 3600;
        else if (part.includes('m')) totalSeconds += parseInt(part) * 60;
        else if (part.includes('s')) totalSeconds += parseInt(part);
      });
      return totalSeconds;
    }
    
    return 0;
  }

  async searchRealAudiobooks(query, type = 'all', limit = 10) {
    try {
      const results = [];
      
      // Search multiple sources in parallel
      const [librivoxResults, archiveResults, openlibResults] = await Promise.all([
        this.searchLibriVox(query, Math.ceil(limit / 3)),
        this.searchInternetArchive(query, Math.ceil(limit / 3)),
        this.searchOpenLibrary(query, Math.ceil(limit / 3))
      ]);

      // Combine and filter results
      results.push(...librivoxResults);
      results.push(...archiveResults);
      results.push(...openlibResults);

      // Filter by type if specified
      let filteredResults = results;
      if (type !== 'all') {
        const queryLower = query.toLowerCase();
        filteredResults = results.filter(book => {
          switch (type) {
            case 'title':
              return book.title.toLowerCase().includes(queryLower);
            case 'author':
              return book.author.toLowerCase().includes(queryLower);
            case 'genre':
              return book.genre.toLowerCase().includes(queryLower);
            default:
              return true;
          }
        });
      }

      // Remove duplicates and limit results
      const uniqueResults = filteredResults.filter((book, index, self) => 
        index === self.findIndex(b => b.title === book.title && b.author === book.author)
      );

      return uniqueResults.slice(0, limit);
    } catch (error) {
      console.error('Real audiobook search error:', error);
      return [];
    }
  }

  async playAudiobook(args) {
    const { query, author, genre } = args;
    
    try {
      // Search for real audiobooks
      const searchQuery = author ? `${query} ${author}` : query;
      const realBooks = await this.searchRealAudiobooks(searchQuery, 'all', 20);
      
      if (realBooks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📚 No real audiobooks found for "${query}". Try searching for classic literature, public domain books, or specific authors like "Shakespeare", "Jane Austen", or "Mark Twain".`,
            },
          ],
        };
      }

      // Filter by genre if specified
      let filteredBooks = realBooks;
      if (genre) {
        filteredBooks = realBooks.filter(book => 
          book.genre.toLowerCase().includes(genre.toLowerCase())
        );
      }

      if (filteredBooks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📚 No audiobooks found in genre "${genre}" for "${query}". Available genres: ${[...new Set(realBooks.map(b => b.genre))].join(', ')}`,
            },
          ],
        };
      }

      // Play the first matching audiobook
      const book = filteredBooks[0];
      this.currentBook = book;
      this.currentChapter = 1;
      this.isPlaying = true;
      this.currentPosition = 0;

      // Initialize reading progress if not exists
      if (!this.readingProgress.has(book.title)) {
        this.readingProgress.set(book.title, {
          totalDuration: book.duration,
          completedDuration: 0,
          chaptersCompleted: 0,
          lastPosition: 0,
          startDate: new Date().toISOString()
        });
      }

      let result = `📚 Now Playing: "${book.title}" by ${book.author}\n`;
      result += `🎭 Narrator: ${book.narrator}\n`;
      result += `📖 Genre: ${book.genre}\n`;
      result += `📅 Year: ${book.year}\n`;
      result += `🌍 Language: ${book.language}\n`;
      result += `📄 Chapters: ${book.chapters}\n`;
      result += `⏱️ Duration: ${Math.floor(book.duration / 3600)}h ${Math.floor((book.duration % 3600) / 60)}m\n`;
      result += `📝 Description: ${book.description.substring(0, 200)}${book.description.length > 200 ? '...' : ''}\n`;
      result += `🔗 Source: ${book.source}\n`;
      result += `🌐 URL: ${book.url}\n\n`;
      result += `🎧 Chapter: ${this.currentChapter}/${book.chapters}\n`;
      result += `▶️ Playing: ${this.isPlaying ? 'YES' : 'NO'}\n`;
      result += `⚡ Speed: ${this.playbackSpeed}x\n`;
      result += `📍 Position: ${Math.floor(this.currentPosition / 60)}:${(this.currentPosition % 60).toString().padStart(2, '0')}\n\n`;

      if (filteredBooks.length > 1) {
        result += `💡 Found ${filteredBooks.length - 1} more matching audiobooks. Use "search_audiobooks" to see all results.\n\n`;
        result += `📚 Other available books:\n`;
        filteredBooks.slice(1, 4).forEach((book, index) => {
          result += `${index + 2}. "${book.title}" by ${book.author} (${book.source})\n`;
        });
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
      throw new Error(`Failed to play audiobook: ${error.message}`);
    }
  }

  async playChapter(args) {
    const { chapter, book_title } = args;
    
    try {
      let book = this.currentBook;
      
      if (book_title && book_title !== this.currentBook?.title) {
        // Search for the specified book
        const audiobookDatabase = [
          { title: '1984', author: 'George Orwell', chapters: 23 },
          { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', chapters: 9 },
          { title: 'To Kill a Mockingbird', author: 'Harper Lee', chapters: 31 },
          { title: 'Dune', author: 'Frank Herbert', chapters: 48 },
          { title: 'The Martian', author: 'Andy Weir', chapters: 26 },
          { title: 'Becoming', author: 'Michelle Obama', chapters: 24 }
        ];
        
        book = audiobookDatabase.find(b => b.title.toLowerCase().includes(book_title.toLowerCase()));
        if (!book) {
          return {
            content: [
              {
                type: 'text',
                text: `📚 Book "${book_title}" not found. Please load it first with "play_audiobook".`,
              },
            ],
          };
        }
      }

      if (!book) {
        return {
          content: [
            {
              type: 'text',
              text: '📚 No audiobook currently loaded. Use "play_audiobook" to load a book first.',
            },
          ],
        };
      }

      if (chapter < 1 || chapter > book.chapters) {
        return {
          content: [
            {
              type: 'text',
              text: `📚 Chapter ${chapter} not found. This book has ${book.chapters} chapters.`,
            },
          ],
        };
      }

      this.currentChapter = chapter;
      this.currentPosition = 0; // Reset position for new chapter
      this.isPlaying = true;

      let result = `📚 Playing Chapter ${chapter} of "${book.title}"\n`;
      result += `👤 Author: ${book.author}\n`;
      result += `📄 Total Chapters: ${book.chapters}\n`;
      result += `▶️ Status: Playing\n`;
      result += `⚡ Speed: ${this.playbackSpeed}x\n`;
      result += `📍 Position: 0:00\n\n`;
      result += `💡 Use "control_playback" to pause, seek, or change chapters.`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to play chapter: ${error.message}`);
    }
  }

  async controlPlayback(args) {
    const { action, value } = args;
    
    try {
      if (!this.currentBook) {
        return {
          content: [
            {
              type: 'text',
              text: '📚 No audiobook currently loaded. Use "play_audiobook" to load a book first.',
            },
          ],
        };
      }

      let result = '';
      
      switch (action) {
        case 'play':
          this.isPlaying = true;
          result = `▶️ Audiobook resumed`;
          if (this.currentBook) {
            result += ` - Now playing: "${this.currentBook.title}" Chapter ${this.currentChapter}`;
          }
          break;
          
        case 'pause':
          this.isPlaying = false;
          result = `⏸️ Audiobook paused`;
          break;
          
        case 'stop':
          this.isPlaying = false;
          this.currentPosition = 0;
          result = `⏹️ Audiobook stopped`;
          break;
          
        case 'next_chapter':
          if (this.currentChapter < this.currentBook.chapters) {
            this.currentChapter++;
            this.currentPosition = 0;
            result = `⏭️ Next chapter: Chapter ${this.currentChapter} of "${this.currentBook.title}"`;
          } else {
            result = `⏭️ Already at the last chapter (${this.currentBook.chapters})`;
          }
          break;
          
        case 'previous_chapter':
          if (this.currentChapter > 1) {
            this.currentChapter--;
            this.currentPosition = 0;
            result = `⏮️ Previous chapter: Chapter ${this.currentChapter} of "${this.currentBook.title}"`;
          } else {
            result = `⏮️ Already at the first chapter`;
          }
          break;
          
        case 'speed':
          if (value !== undefined && value >= 0.5 && value <= 3.0) {
            this.playbackSpeed = value;
            result = `⚡ Playback speed set to ${this.playbackSpeed}x`;
          } else {
            result = `⚡ Current speed: ${this.playbackSpeed}x (use value 0.5-3.0 to change)`;
          }
          break;
          
        case 'seek':
          if (value !== undefined) {
            this.currentPosition = value;
            result = `⏰ Seeked to ${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
          } else {
            result = `⏰ Use seek action with value parameter to seek to specific time in seconds`;
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
      throw new Error(`Failed to control playback: ${error.message}`);
    }
  }

  async searchAudiobooks(args) {
    const { query, type = 'all', limit = 10 } = args;
    
    try {
      const realBooks = await this.searchRealAudiobooks(query, type, limit);
      
      if (realBooks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔍 No audiobooks found for "${query}". Try searching for:\n\n• Classic literature: "Shakespeare", "Jane Austen", "Mark Twain"\n• Public domain books: "Pride and Prejudice", "Moby Dick", "Sherlock Holmes"\n• Specific genres: "science fiction", "mystery", "biography"\n• Popular authors: "Charles Dickens", "Edgar Allan Poe", "H.G. Wells"`,
            },
          ],
        };
      }

      let result = `🔍 Search results for "${query}" (${type}):\n\n`;
      
      realBooks.forEach((book, index) => {
        result += `${index + 1}. 📚 "${book.title}"\n`;
        result += `   👤 Author: ${book.author}\n`;
        result += `   🎭 Narrator: ${book.narrator}\n`;
        result += `   📖 Genre: ${book.genre}\n`;
        result += `   📅 Year: ${book.year}\n`;
        result += `   🌍 Language: ${book.language}\n`;
        result += `   📄 Chapters: ${book.chapters}\n`;
        if (book.duration > 0) {
          result += `   ⏱️ Duration: ${Math.floor(book.duration / 3600)}h ${Math.floor((book.duration % 3600) / 60)}m\n`;
        }
        result += `   🔗 Source: ${book.source}\n`;
        result += `   🌐 URL: ${book.url}\n`;
        if (book.cover) {
          result += `   🖼️ Cover: ${book.cover}\n`;
        }
        result += `   📝 ${book.description.substring(0, 150)}${book.description.length > 150 ? '...' : ''}\n\n`;
      });

      result += `💡 Use "play_audiobook" with the title to start listening!`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search audiobooks: ${error.message}`);
    }
  }

  async getCurrentBook(args) {
    try {
      if (!this.currentBook) {
        return {
          content: [
            {
              type: 'text',
              text: '📚 No audiobook currently playing. Use "play_audiobook" to start playing an audiobook.',
            },
          ],
        };
      }

      let result = `📚 Currently Playing:\n`;
      result += `📖 Title: "${this.currentBook.title}"\n`;
      result += `👤 Author: ${this.currentBook.author}\n`;
      result += `🎭 Narrator: ${this.currentBook.narrator}\n`;
      result += `📖 Genre: ${this.currentBook.genre}\n`;
      result += `📅 Year: ${this.currentBook.year}\n`;
      result += `📄 Total Chapters: ${this.currentBook.chapters}\n\n`;
      
      result += `🎧 Current Status:\n`;
      result += `📄 Chapter: ${this.currentChapter}/${this.currentBook.chapters}\n`;
      result += `▶️ Playing: ${this.isPlaying ? 'YES' : 'NO'}\n`;
      result += `⚡ Speed: ${this.playbackSpeed}x\n`;
      result += `📍 Position: ${Math.floor(this.currentPosition / 60)}:${(this.currentPosition % 60).toString().padStart(2, '0')}\n`;
      
      // Get reading progress
      const progress = this.readingProgress.get(this.currentBook.title);
      if (progress) {
        const progressPercent = Math.round((progress.completedDuration / progress.totalDuration) * 100);
        result += `📊 Progress: ${progressPercent}% completed\n`;
        result += `⏱️ Total Duration: ${Math.floor(progress.totalDuration / 3600)}h ${Math.floor((progress.totalDuration % 3600) / 60)}m\n`;
        result += `✅ Completed: ${Math.floor(progress.completedDuration / 3600)}h ${Math.floor((progress.completedDuration % 3600) / 60)}m`;
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
      throw new Error(`Failed to get current book info: ${error.message}`);
    }
  }

  async addBookmark(args) {
    const { name, position, chapter } = args;
    
    try {
      if (!this.currentBook) {
        return {
          content: [
            {
              type: 'text',
              text: '📚 No audiobook currently loaded. Use "play_audiobook" to load a book first.',
            },
          ],
        };
      }

      const bookmarkPosition = position !== undefined ? position : this.currentPosition;
      const bookmarkChapter = chapter !== undefined ? chapter : this.currentChapter;

      if (!this.bookmarks.has(this.currentBook.title)) {
        this.bookmarks.set(this.currentBook.title, []);
      }

      const bookmark = {
        name,
        position: bookmarkPosition,
        chapter: bookmarkChapter,
        timestamp: new Date().toISOString(),
        timeString: `${Math.floor(bookmarkPosition / 60)}:${(bookmarkPosition % 60).toString().padStart(2, '0')}`
      };

      this.bookmarks.get(this.currentBook.title).push(bookmark);

      let result = `🔖 Bookmark added: "${name}"\n`;
      result += `📚 Book: ${this.currentBook.title}\n`;
      result += `📄 Chapter: ${bookmarkChapter}\n`;
      result += `⏰ Position: ${bookmark.timeString}\n`;
      result += `📅 Date: ${new Date(bookmark.timestamp).toLocaleDateString()}`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to add bookmark: ${error.message}`);
    }
  }

  async listBookmarks(args) {
    const { book_title } = args;
    
    try {
      const targetBook = book_title || this.currentBook?.title;
      
      if (!targetBook) {
        return {
          content: [
            {
              type: 'text',
              text: '📚 No book specified and no audiobook currently loaded.',
            },
          ],
        };
      }

      const bookmarks = this.bookmarks.get(targetBook) || [];

      if (bookmarks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🔖 No bookmarks found for "${targetBook}". Use "add_bookmark" to create bookmarks.`,
            },
          ],
        };
      }

      let result = `🔖 Bookmarks for "${targetBook}":\n\n`;
      bookmarks.forEach((bookmark, index) => {
        result += `${index + 1}. 📌 ${bookmark.name}\n`;
        result += `   📄 Chapter: ${bookmark.chapter}\n`;
        result += `   ⏰ Position: ${bookmark.timeString}\n`;
        result += `   📅 Date: ${new Date(bookmark.timestamp).toLocaleDateString()}\n\n`;
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
      throw new Error(`Failed to list bookmarks: ${error.message}`);
    }
  }

  async setReadingSpeed(args) {
    const { speed } = args;
    
    try {
      if (speed < 0.5 || speed > 3.0) {
        return {
          content: [
            {
              type: 'text',
              text: '⚡ Speed must be between 0.5x and 3.0x. Current speed: ' + this.playbackSpeed + 'x',
            },
          ],
        };
      }

      this.playbackSpeed = speed;

      let result = `⚡ Reading speed set to ${this.playbackSpeed}x\n`;
      
      if (this.currentBook) {
        result += `📚 Book: ${this.currentBook.title}\n`;
        result += `📄 Chapter: ${this.currentChapter}`;
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
      throw new Error(`Failed to set reading speed: ${error.message}`);
    }
  }

  async getReadingProgress(args) {
    const { book_title } = args;
    
    try {
      const targetBook = book_title || this.currentBook?.title;
      
      if (!targetBook) {
        return {
          content: [
            {
              type: 'text',
              text: '📚 No book specified and no audiobook currently loaded.',
            },
          ],
        };
      }

      const progress = this.readingProgress.get(targetBook);

      if (!progress) {
        return {
          content: [
            {
              type: 'text',
              text: `📊 No reading progress found for "${targetBook}". Start reading to track progress.`,
            },
          ],
        };
      }

      const progressPercent = Math.round((progress.completedDuration / progress.totalDuration) * 100);
      const remainingDuration = progress.totalDuration - progress.completedDuration;
      const startDate = new Date(progress.startDate);
      const daysReading = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));

      let result = `📊 Reading Progress for "${targetBook}":\n\n`;
      result += `📈 Overall Progress: ${progressPercent}%\n`;
      result += `⏱️ Total Duration: ${Math.floor(progress.totalDuration / 3600)}h ${Math.floor((progress.totalDuration % 3600) / 60)}m\n`;
      result += `✅ Completed: ${Math.floor(progress.completedDuration / 3600)}h ${Math.floor((progress.completedDuration % 3600) / 60)}m\n`;
      result += `⏳ Remaining: ${Math.floor(remainingDuration / 3600)}h ${Math.floor((remainingDuration % 3600) / 60)}m\n`;
      result += `📄 Chapters Completed: ${progress.chaptersCompleted}\n`;
      result += `📅 Started: ${startDate.toLocaleDateString()}\n`;
      result += `📆 Days Reading: ${daysReading} days\n`;
      
      if (daysReading > 0) {
        const avgPerDay = Math.round(progress.completedDuration / daysReading / 60); // minutes per day
        result += `📊 Average per Day: ${avgPerDay} minutes`;
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
      throw new Error(`Failed to get reading progress: ${error.message}`);
    }
  }

  async createReadingList(args) {
    const { name, books } = args;
    
    try {
      this.readingLists.set(name, books);

      let result = `📚 Reading List Created: "${name}"\n`;
      result += `📋 ${books.length} books added:\n\n`;
      
      books.forEach((book, index) => {
        result += `${index + 1}. 📖 ${book}\n`;
      });

      result += `\n💡 Use "play_audiobook" to start reading any book from this list.`;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create reading list: ${error.message}`);
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Audiobook MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new AudiobookMCPServer();
server.run().catch(console.error);
