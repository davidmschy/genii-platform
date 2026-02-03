import { GeniiConfig, GeniiApiResponse, GeniiOrganization, GeniiBusiness, GeniiProject, GeniiAgent, CreateOrganizationRequest, CreateBusinessRequest, CreateProjectRequest, SpawnAgentRequest } from './types';

export class GeniiApiClient {
  private config: GeniiConfig;

  constructor(config: GeniiConfig) {
    this.config = {
      baseUrl: 'https://api.genii.ai/v1',
      ...config,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<GeniiApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        data: null as unknown as T,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Health check
  async health(): Promise<GeniiApiResponse<{ status: string; version: string }>> {
    return this.request('/health', { method: 'GET' });
  }

  // Organization endpoints
  async createOrganization(request: CreateOrganizationRequest): Promise<GeniiApiResponse<GeniiOrganization>> {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getOrganization(id: string): Promise<GeniiApiResponse<GeniiOrganization>> {
    return this.request(`/organizations/${id}`, { method: 'GET' });
  }

  async listOrganizations(): Promise<GeniiApiResponse<GeniiOrganization[]>> {
    return this.request('/organizations', { method: 'GET' });
  }

  // Business endpoints
  async createBusiness(request: CreateBusinessRequest): Promise<GeniiApiResponse<GeniiBusiness>> {
    return this.request('/businesses', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getBusiness(id: string): Promise<GeniiApiResponse<GeniiBusiness>> {
    return this.request(`/businesses/${id}`, { method: 'GET' });
  }

  async listBusinesses(organizationId?: string): Promise<GeniiApiResponse<GeniiBusiness[]>> {
    const query = organizationId ? `?organizationId=${organizationId}` : '';
    return this.request(`/businesses${query}`, { method: 'GET' });
  }

  // Project endpoints
  async createProject(request: CreateProjectRequest): Promise<GeniiApiResponse<GeniiProject>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getProject(id: string): Promise<GeniiApiResponse<GeniiProject>> {
    return this.request(`/projects/${id}`, { method: 'GET' });
  }

  async listProjects(businessId?: string): Promise<GeniiApiResponse<GeniiProject[]>> {
    const query = businessId ? `?businessId=${businessId}` : '';
    return this.request(`/projects${query}`, { method: 'GET' });
  }

  // Agent endpoints
  async spawnAgent(request: SpawnAgentRequest): Promise<GeniiApiResponse<GeniiAgent>> {
    return this.request('/agents/spawn', {
      method: 'POST',
      body: JSON.stringify({
        model: 'gpt-4',
        capabilities: [],
        ...request,
      }),
    });
  }

  async getAgent(id: string): Promise<GeniiApiResponse<GeniiAgent>> {
    return this.request(`/agents/${id}`, { method: 'GET' });
  }

  async listAgents(projectId?: string): Promise<GeniiApiResponse<GeniiAgent[]>> {
    const query = projectId ? `?projectId=${projectId}` : '';
    return this.request(`/agents${query}`, { method: 'GET' });
  }

  async sendMessage(agentId: string, message: string): Promise<GeniiApiResponse<{ response: string }>> {
    return this.request(`/agents/${agentId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Config getters/setters
  getConfig(): GeniiConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GeniiConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

export function createClient(config: GeniiConfig): GeniiApiClient {
  return new GeniiApiClient(config);
}
