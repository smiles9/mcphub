#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// UK News MCP Server
class UKNewsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'uk-news-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

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
            name: 'get_uk_headlines',
            description: 'Get the latest UK news headlines from major news sources',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  enum: ['all', 'bbc', 'guardian', 'independent', 'telegraph', 'times', 'mirror'],
                  description: 'News source to fetch from (default: all)',
                  default: 'all',
                },
                category: {
                  type: 'string',
                  enum: ['all', 'politics', 'business', 'sports', 'technology', 'health', 'world'],
                  description: 'News category to filter by (default: all)',
                  default: 'all',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of headlines to return (default: 10)',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'search_uk_news',
            description: 'Search UK news articles by keywords or topics',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query or keywords to look for in news articles',
                },
                source: {
                  type: 'string',
                  enum: ['all', 'bbc', 'guardian', 'independent', 'telegraph', 'times', 'mirror'],
                  description: 'News source to search in (default: all)',
                  default: 'all',
                },
                days: {
                  type: 'number',
                  description: 'Number of days back to search (default: 7)',
                  default: 7,
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_breaking_news',
            description: 'Get breaking news alerts and urgent UK news updates',
            inputSchema: {
              type: 'object',
              properties: {
                limit: {
                  type: 'number',
                  description: 'Maximum number of breaking news items to return (default: 5)',
                  default: 5,
                },
              },
            },
          },
          {
            name: 'get_news_by_region',
            description: 'Get news specific to UK regions (England, Scotland, Wales, Northern Ireland)',
            inputSchema: {
              type: 'object',
              properties: {
                region: {
                  type: 'string',
                  enum: ['all', 'england', 'scotland', 'wales', 'northern-ireland', 'london'],
                  description: 'UK region to get news for',
                  default: 'all',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of articles to return (default: 10)',
                  default: 10,
                },
              },
            },
          },
          {
            name: 'get_news_analysis',
            description: 'Get in-depth analysis and opinion pieces on UK news topics',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: 'Topic or subject for analysis (e.g., "Brexit", "Climate Change", "Economy")',
                },
                source: {
                  type: 'string',
                  enum: ['all', 'bbc', 'guardian', 'independent', 'telegraph', 'times'],
                  description: 'News source for analysis (default: all)',
                  default: 'all',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of analysis articles to return (default: 5)',
                  default: 5,
                },
              },
              required: ['topic'],
            },
          },
          {
            name: 'get_weather_news',
            description: 'Get UK weather-related news and forecasts',
            inputSchema: {
              type: 'object',
              properties: {
                region: {
                  type: 'string',
                  enum: ['all', 'england', 'scotland', 'wales', 'northern-ireland'],
                  description: 'UK region for weather news (default: all)',
                  default: 'all',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of weather news items to return (default: 5)',
                  default: 5,
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
          case 'get_uk_headlines':
            return await this.getUKHeadlines(args);
          case 'search_uk_news':
            return await this.searchUKNews(args);
          case 'get_breaking_news':
            return await this.getBreakingNews(args);
          case 'get_news_by_region':
            return await this.getNewsByRegion(args);
          case 'get_news_analysis':
            return await this.getNewsAnalysis(args);
          case 'get_weather_news':
            return await this.getWeatherNews(args);
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

  async getUKHeadlines(args) {
    const { source = 'all', category = 'all', limit = 10 } = args;
    
    try {
      // Mock UK news headlines database
      const newsDatabase = [
        {
          title: 'PM announces new climate change initiative ahead of COP28',
          source: 'BBC',
          category: 'politics',
          region: 'england',
          published: '2 hours ago',
          url: 'mock://bbc-climate-initiative',
          summary: 'Prime Minister unveils ambitious plans to accelerate UK\'s transition to renewable energy'
        },
        {
          title: 'Bank of England holds interest rates at 5.25%',
          source: 'Guardian',
          category: 'business',
          region: 'england',
          published: '4 hours ago',
          url: 'mock://guardian-boe-rates',
          summary: 'Monetary Policy Committee votes to maintain current rates amid economic uncertainty'
        },
        {
          title: 'Scotland introduces new education reforms',
          source: 'BBC',
          category: 'politics',
          region: 'scotland',
          published: '6 hours ago',
          url: 'mock://bbc-scotland-education',
          summary: 'Holyrood announces comprehensive changes to Scottish education system'
        },
        {
          title: 'Wales wins Six Nations rugby championship',
          source: 'Independent',
          category: 'sports',
          region: 'wales',
          published: '1 day ago',
          url: 'mock://independent-wales-rugby',
          summary: 'Wales defeats France in thrilling final to claim Six Nations title'
        },
        {
          title: 'UK tech sector sees record investment in Q4',
          source: 'Telegraph',
          category: 'technology',
          region: 'england',
          published: '1 day ago',
          url: 'mock://telegraph-tech-investment',
          summary: 'Venture capital funding reaches new heights in British technology companies'
        },
        {
          title: 'NHS announces new mental health funding',
          source: 'Times',
          category: 'health',
          region: 'all',
          published: '2 days ago',
          url: 'mock://times-nhs-mental-health',
          summary: 'Government pledges additional £2.3 billion for mental health services'
        },
        {
          title: 'Northern Ireland power-sharing talks continue',
          source: 'BBC',
          category: 'politics',
          region: 'northern-ireland',
          published: '2 days ago',
          url: 'mock://bbc-ni-talks',
          summary: 'Political leaders meet to discuss restoration of devolved government'
        },
        {
          title: 'London housing prices show first decline in 18 months',
          source: 'Guardian',
          category: 'business',
          region: 'london',
          published: '3 days ago',
          url: 'mock://guardian-london-housing',
          summary: 'Average property prices in London drop by 2.3% in latest quarter'
        }
      ];

      // Filter by source
      let filteredNews = source === 'all' ? newsDatabase : 
        newsDatabase.filter(item => item.source.toLowerCase() === source.toLowerCase());

      // Filter by category
      filteredNews = category === 'all' ? filteredNews : 
        filteredNews.filter(item => item.category === category);

      // Limit results
      filteredNews = filteredNews.slice(0, limit);

      if (filteredNews.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📰 No headlines found for ${source} in ${category} category.`,
            },
          ],
        };
      }

      let result = `📰 UK News Headlines (${source} - ${category}):\n\n`;
      filteredNews.forEach((article, index) => {
        result += `${index + 1}. ${article.title}\n`;
        result += `   📰 Source: ${article.source} | 📍 ${article.region} | ⏰ ${article.published}\n`;
        result += `   📝 ${article.summary}\n\n`;
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
      throw new Error(`Failed to get UK headlines: ${error.message}`);
    }
  }

  async searchUKNews(args) {
    const { query, source = 'all', days = 7, limit = 10 } = args;
    
    try {
      // Mock search results
      const searchResults = [
        {
          title: `Government announces new ${query} policy framework`,
          source: 'BBC',
          published: '1 day ago',
          url: 'mock://bbc-policy-framework',
          summary: `Comprehensive new approach to ${query} aims to address current challenges`
        },
        {
          title: `${query} experts call for urgent action`,
          source: 'Guardian',
          published: '2 days ago',
          url: 'mock://guardian-expert-call',
          summary: `Leading researchers warn that immediate steps are needed regarding ${query}`
        },
        {
          title: `Public opinion on ${query} shifts dramatically`,
          source: 'Independent',
          published: '3 days ago',
          url: 'mock://independent-public-opinion',
          summary: `Latest polls show significant changes in how Britons view ${query}`
        }
      ];

      let result = `🔍 Search Results for "${query}":\n`;
      result += `📅 Last ${days} days | 📰 Source: ${source}\n\n`;

      searchResults.slice(0, limit).forEach((article, index) => {
        result += `${index + 1}. ${article.title}\n`;
        result += `   📰 ${article.source} | ⏰ ${article.published}\n`;
        result += `   📝 ${article.summary}\n\n`;
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
      throw new Error(`Failed to search UK news: ${error.message}`);
    }
  }

  async getBreakingNews(args) {
    const { limit = 5 } = args;
    
    try {
      const breakingNews = [
        {
          title: 'URGENT: Major incident declared in central London',
          source: 'BBC',
          published: '30 minutes ago',
          severity: 'high',
          summary: 'Emergency services responding to incident near Westminster'
        },
        {
          title: 'BREAKING: Bank of England emergency meeting called',
          source: 'Guardian',
          published: '1 hour ago',
          severity: 'high',
          summary: 'MPC to convene urgently amid financial market volatility'
        },
        {
          title: 'ALERT: Severe weather warning issued for Scotland',
          source: 'BBC',
          published: '2 hours ago',
          severity: 'medium',
          summary: 'Met Office warns of potential flooding in western Scotland'
        },
        {
          title: 'URGENT: NHS cyber security incident reported',
          source: 'Times',
          published: '3 hours ago',
          severity: 'high',
          summary: 'Several hospitals affected by suspected cyber attack'
        },
        {
          title: 'BREAKING: UK-EU trade talks resume unexpectedly',
          source: 'Independent',
          published: '4 hours ago',
          severity: 'medium',
          summary: 'Officials meet in Brussels to discuss post-Brexit arrangements'
        }
      ];

      let result = `🚨 UK Breaking News:\n\n`;
      breakingNews.slice(0, limit).forEach((news, index) => {
        const severityIcon = news.severity === 'high' ? '🔴' : '🟡';
        result += `${severityIcon} ${news.title}\n`;
        result += `   📰 ${news.source} | ⏰ ${news.published}\n`;
        result += `   📝 ${news.summary}\n\n`;
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
      throw new Error(`Failed to get breaking news: ${error.message}`);
    }
  }

  async getNewsByRegion(args) {
    const { region = 'all', limit = 10 } = args;
    
    try {
      const regionalNews = {
        'england': [
          { title: 'New transport infrastructure plan for England', source: 'BBC', summary: 'Government announces £50bn investment in roads and railways' },
          { title: 'England cricket team wins Test series', source: 'Guardian', summary: 'Victory over Australia in thrilling final match' }
        ],
        'scotland': [
          { title: 'Scottish independence referendum debate intensifies', source: 'BBC', summary: 'Political parties clash over future constitutional arrangements' },
          { title: 'Edinburgh Festival announces record attendance', source: 'Independent', summary: 'Cultural event attracts visitors from around the world' }
        ],
        'wales': [
          { title: 'Welsh language education expands across Wales', source: 'BBC', summary: 'New initiatives to promote Welsh language learning' },
          { title: 'Wales celebrates St David\'s Day with national events', source: 'Guardian', summary: 'Communities come together to celebrate Welsh culture' }
        ],
        'northern-ireland': [
          { title: 'Belfast tech hub attracts major investment', source: 'BBC', summary: 'International companies choose Northern Ireland for expansion' },
          { title: 'Peace process anniversary commemorated', source: 'Times', summary: '25 years since the Good Friday Agreement' }
        ],
        'london': [
          { title: 'London Underground announces new line extension', source: 'BBC', summary: 'Northern Line extension to serve growing communities' },
          { title: 'Mayor announces new affordable housing initiative', source: 'Guardian', summary: 'Plans to build 10,000 new affordable homes' }
        ]
      };

      let result = `📰 UK Regional News (${region}):\n\n`;
      const newsItems = region === 'all' ? 
        Object.values(regionalNews).flat() : 
        regionalNews[region] || [];

      newsItems.slice(0, limit).forEach((article, index) => {
        result += `${index + 1}. ${article.title}\n`;
        result += `   📰 ${article.source}\n`;
        result += `   📝 ${article.summary}\n\n`;
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
      throw new Error(`Failed to get regional news: ${error.message}`);
    }
  }

  async getNewsAnalysis(args) {
    const { topic, source = 'all', limit = 5 } = args;
    
    try {
      const analysisArticles = [
        {
          title: `In-depth analysis: The future of ${topic} in the UK`,
          source: 'Guardian',
          author: 'Political Correspondent',
          published: '2 days ago',
          summary: `Comprehensive examination of how ${topic} will shape Britain's future`,
          keyPoints: ['Economic implications', 'Social impact', 'Policy recommendations']
        },
        {
          title: `Opinion: Why ${topic} matters more than ever`,
          source: 'Times',
          author: 'Editorial Board',
          published: '3 days ago',
          summary: `Editorial perspective on the significance of ${topic} in current affairs`,
          keyPoints: ['Historical context', 'Current challenges', 'Future outlook']
        },
        {
          title: `Expert view: The science behind ${topic}`,
          source: 'BBC',
          author: 'Science Editor',
          published: '4 days ago',
          summary: `Scientific analysis and expert opinions on ${topic}`,
          keyPoints: ['Research findings', 'Expert consensus', 'Uncertainty areas']
        }
      ];

      let result = `📊 News Analysis: ${topic}\n`;
      result += `📰 Sources: ${source}\n\n`;

      analysisArticles.slice(0, limit).forEach((article, index) => {
        result += `${index + 1}. ${article.title}\n`;
        result += `   📰 ${article.source} | 👤 ${article.author} | ⏰ ${article.published}\n`;
        result += `   📝 ${article.summary}\n`;
        result += `   🔑 Key Points: ${article.keyPoints.join(', ')}\n\n`;
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
      throw new Error(`Failed to get news analysis: ${error.message}`);
    }
  }

  async getWeatherNews(args) {
    const { region = 'all', limit = 5 } = args;
    
    try {
      const weatherNews = [
        {
          title: 'UK weather: Storm warning issued for weekend',
          region: 'all',
          summary: 'Met Office warns of strong winds and heavy rain across much of the UK',
          impact: 'Travel disruption expected'
        },
        {
          title: 'Scotland braces for severe winter weather',
          region: 'scotland',
          summary: 'Heavy snow and ice warnings in place for Highlands and Islands',
          impact: 'School closures and transport delays'
        },
        {
          title: 'London heatwave continues for third day',
          region: 'london',
          summary: 'Temperatures reach 32°C as heatwave persists in capital',
          impact: 'Health warnings issued for vulnerable groups'
        },
        {
          title: 'Wales flooding risk as rivers reach danger levels',
          region: 'wales',
          summary: 'Environment Agency issues flood warnings for several Welsh rivers',
          impact: 'Residents advised to prepare for potential evacuation'
        },
        {
          title: 'Northern Ireland fog disrupts flights',
          region: 'northern-ireland',
          summary: 'Dense fog at Belfast airports causes delays and cancellations',
          impact: 'Passengers advised to check flight status'
        }
      ];

      let result = `🌤️ UK Weather News (${region}):\n\n`;
      const filteredNews = region === 'all' ? 
        weatherNews : 
        weatherNews.filter(item => item.region === region || item.region === 'all');

      filteredNews.slice(0, limit).forEach((news, index) => {
        result += `${index + 1}. ${news.title}\n`;
        result += `   📍 ${news.region}\n`;
        result += `   📝 ${news.summary}\n`;
        result += `   ⚠️ Impact: ${news.impact}\n\n`;
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
      throw new Error(`Failed to get weather news: ${error.message}`);
    }
  }

  async run() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('UK News MCP server running on stdio');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

const server = new UKNewsMCPServer();
server.run().catch(console.error);
