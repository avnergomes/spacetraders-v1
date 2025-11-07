import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import { redis } from './redis';

interface SpaceTradersConfig {
  apiUrl: string;
  token: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export class SpaceTradersAPI {
  private client: AxiosInstance;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: SpaceTradersConfig) {
    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.spacetraders.io/v2',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
      },
      timeout: 30000
    });

    // Response interceptor to handle rate limiting and caching
    this.client.interceptors.response.use(
      (response) => this.handleSuccessResponse(response),
      (error) => this.handleErrorResponse(error)
    );

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`SpaceTraders API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private handleSuccessResponse(response: AxiosResponse): AxiosResponse {
    // Extract rate limit information from headers
    const headers = response.headers;
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit']),
        remaining: parseInt(headers['x-ratelimit-remaining']),
        reset: new Date(headers['x-ratelimit-reset'])
      };

      logger.debug(`Rate limit: ${this.rateLimitInfo.remaining}/${this.rateLimitInfo.limit}`);
    }

    // Cache successful responses
    this.cacheResponse(response);

    return response;
  }

  private async handleErrorResponse(error: AxiosError): Promise<any> {
    if (error.response) {
      const { status, data } = error.response;

      // Handle rate limiting
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        logger.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await this.delay(waitTime);
        
        // Retry the request
        return this.client.request(error.config!);
      }

      // Handle other errors
      logger.error(`SpaceTraders API Error: ${status} - ${JSON.stringify(data)}`);
      
      if (status === 401) {
        throw new Error('Invalid API token. Please check your configuration.');
      }
    } else if (error.request) {
      logger.error('No response received from SpaceTraders API');
    } else {
      logger.error('Error setting up request:', error.message);
    }

    throw error;
  }

  private async cacheResponse(response: AxiosResponse): Promise<void> {
    const cacheKey = this.getCacheKey(response.config);
    const ttl = this.getCacheTTL(response.config.url!);

    if (ttl > 0) {
      try {
        await redis.setex(cacheKey, ttl, JSON.stringify(response.data));
        logger.debug(`Cached response for ${cacheKey} with TTL ${ttl}s`);
      } catch (error) {
        logger.error('Failed to cache response:', error);
      }
    }
  }

  private getCacheKey(config: any): string {
    const method = config.method || 'get';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    return `st:${method}:${url}:${params}`;
  }

  private getCacheTTL(url: string): number {
    // Different TTL for different endpoints
    if (url.includes('/systems') || url.includes('/factions')) {
      return 3600; // 1 hour for static data
    } else if (url.includes('/markets')) {
      return 60; // 1 minute for market data
    } else if (url.includes('/my/')) {
      return 0; // No caching for personal data
    }
    return 300; // 5 minutes default
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Agent endpoints
  async getAgent(): Promise<any> {
    const response = await this.client.get('/my/agent');
    return response.data;
  }

  async registerAgent(symbol: string, faction: string, email?: string): Promise<any> {
    const response = await this.client.post('/register', {
      symbol,
      faction,
      email
    });
    return response.data;
  }

  // Fleet endpoints
  async getFleet(): Promise<any> {
    const response = await this.client.get('/my/ships');
    return response.data;
  }

  async getShip(shipSymbol: string): Promise<any> {
    const response = await this.client.get(`/my/ships/${shipSymbol}`);
    return response.data;
  }

  async purchaseShip(shipType: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.post('/my/ships', {
      shipType,
      waypointSymbol
    });
    return response.data;
  }

  async navigateShip(shipSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/navigate`, {
      waypointSymbol
    });
    return response.data;
  }

  async dockShip(shipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/dock`);
    return response.data;
  }

  async orbitShip(shipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/orbit`);
    return response.data;
  }

  async refuelShip(shipSymbol: string, units?: number, fromCargo?: boolean): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/refuel`, {
      units,
      fromCargo
    });
    return response.data;
  }

  async extractResources(shipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/extract`);
    return response.data;
  }

  async sellCargo(shipSymbol: string, symbol: string, units: number): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/sell`, {
      symbol,
      units
    });
    return response.data;
  }

  async purchaseCargo(shipSymbol: string, symbol: string, units: number): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/purchase`, {
      symbol,
      units
    });
    return response.data;
  }

  async transferCargo(fromShipSymbol: string, tradeSymbol: string, units: number, toShipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${fromShipSymbol}/transfer`, {
      tradeSymbol,
      units,
      shipSymbol: toShipSymbol
    });
    return response.data;
  }

  async jettison(shipSymbol: string, symbol: string, units: number): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/jettison`, {
      symbol,
      units
    });
    return response.data;
  }

  async scanSystems(shipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/scan/systems`);
    return response.data;
  }

  async scanWaypoints(shipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/scan/waypoints`);
    return response.data;
  }

  async scanShips(shipSymbol: string): Promise<any> {
    const response = await this.client.post(`/my/ships/${shipSymbol}/scan/ships`);
    return response.data;
  }

  // Contract endpoints
  async getContracts(page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.client.get('/my/contracts', {
      params: { page, limit }
    });
    return response.data;
  }

  async getContract(contractId: string): Promise<any> {
    const response = await this.client.get(`/my/contracts/${contractId}`);
    return response.data;
  }

  async acceptContract(contractId: string): Promise<any> {
    const response = await this.client.post(`/my/contracts/${contractId}/accept`);
    return response.data;
  }

  async deliverContract(contractId: string, shipSymbol: string, tradeSymbol: string, units: number): Promise<any> {
    const response = await this.client.post(`/my/contracts/${contractId}/deliver`, {
      shipSymbol,
      tradeSymbol,
      units
    });
    return response.data;
  }

  async fulfillContract(contractId: string): Promise<any> {
    const response = await this.client.post(`/my/contracts/${contractId}/fulfill`);
    return response.data;
  }

  // System endpoints
  async getSystems(page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.client.get('/systems', {
      params: { page, limit }
    });
    return response.data;
  }

  async getSystem(systemSymbol: string): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}`);
    return response.data;
  }

  async getWaypoints(systemSymbol: string, page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}/waypoints`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getWaypoint(systemSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}/waypoints/${waypointSymbol}`);
    return response.data;
  }

  async getMarket(systemSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}/waypoints/${waypointSymbol}/market`);
    return response.data;
  }

  async getShipyard(systemSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}/waypoints/${waypointSymbol}/shipyard`);
    return response.data;
  }

  async getJumpGate(systemSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}/waypoints/${waypointSymbol}/jump-gate`);
    return response.data;
  }

  async getConstruction(systemSymbol: string, waypointSymbol: string): Promise<any> {
    const response = await this.client.get(`/systems/${systemSymbol}/waypoints/${waypointSymbol}/construction`);
    return response.data;
  }

  async supplyConstruction(systemSymbol: string, waypointSymbol: string, shipSymbol: string, tradeSymbol: string, units: number): Promise<any> {
    const response = await this.client.post(`/systems/${systemSymbol}/waypoints/${waypointSymbol}/construction/supply`, {
      shipSymbol,
      tradeSymbol,
      units
    });
    return response.data;
  }

  // Faction endpoints
  async getFactions(page: number = 1, limit: number = 20): Promise<any> {
    const response = await this.client.get('/factions', {
      params: { page, limit }
    });
    return response.data;
  }

  async getFaction(factionSymbol: string): Promise<any> {
    const response = await this.client.get(`/factions/${factionSymbol}`);
    return response.data;
  }

  // Utility methods for rate limiting info
  getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  isRateLimited(): boolean {
    if (!this.rateLimitInfo) return false;
    return this.rateLimitInfo.remaining === 0 && new Date() < this.rateLimitInfo.reset;
  }

  getTimeUntilReset(): number {
    if (!this.rateLimitInfo) return 0;
    const now = new Date();
    const reset = this.rateLimitInfo.reset;
    return Math.max(0, reset.getTime() - now.getTime());
  }
}

// Create singleton instance
const config: SpaceTradersConfig = {
  apiUrl: process.env.SPACETRADERS_API_URL || 'https://api.spacetraders.io/v2',
  token: process.env.SPACETRADERS_TOKEN || ''
};

export const spaceTradersAPI = new SpaceTradersAPI(config);
