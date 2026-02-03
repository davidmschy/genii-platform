// Genii API Types

export interface GeniiConfig {
  apiKey: string;
  baseUrl: string;
  organizationId?: string;
}

export interface GeniiOrganization {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeniiBusiness {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  industry?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeniiProject {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'draft';
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeniiAgent {
  id: string;
  projectId: string;
  name: string;
  role: string;
  model: string;
  systemPrompt?: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'offline' | 'error';
  config?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
}

export interface CreateBusinessRequest {
  name: string;
  description?: string;
  industry?: string;
  organizationId: string;
  settings?: Record<string, unknown>;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  businessId: string;
  status?: 'active' | 'archived' | 'draft';
  settings?: Record<string, unknown>;
}

export interface SpawnAgentRequest {
  name: string;
  role: string;
  projectId: string;
  model?: string;
  systemPrompt?: string;
  capabilities?: string[];
  config?: Record<string, unknown>;
}

export interface GeniiApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ConnectOptions {
  apiKey: string;
  baseUrl?: string;
  save?: boolean;
}
