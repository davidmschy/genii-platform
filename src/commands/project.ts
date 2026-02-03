import { CommandContext, CommandResult } from 'openclaw';
import { CreateProjectRequest } from '../types';
import { createClient } from '../api-client';

interface ProjectContext extends CommandContext {
  options: {
    name: string;
    description?: string;
    businessId?: string;
    status?: 'active' | 'archived' | 'draft';
  };
  config: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    save(): Promise<void>;
  };
}

export default {
  name: 'project',
  description: 'Manage Genii projects',
  usage: 'genii project <subcommand> [options]',
  
  subcommands: ['create', 'list', 'get'],

  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: false,
      description: 'Project name',
    },
    {
      name: 'description',
      alias: 'd',
      type: 'string',
      required: false,
      description: 'Project description',
    },
    {
      name: 'business-id',
      alias: 'b',
      type: 'string',
      required: false,
      description: 'Business ID (uses default if not specified)',
    },
    {
      name: 'status',
      alias: 's',
      type: 'string',
      required: false,
      description: 'Project status (active, archived, draft)',
    },
  ],

  async execute(context: ProjectContext): Promise<CommandResult> {
    const { options, args, logger, config } = context;
    const subcommand = args[0] || 'create';

    // Get API credentials
    const apiKey = config.get('genii.apiKey');
    const baseUrl = config.get('genii.baseUrl') || 'https://api.genii.ai/v1';

    if (!apiKey) {
      return {
        success: false,
        message: '❌ Not authenticated. Run "genii connect --api-key <key>" first.',
      };
    }

    const client = createClient({ apiKey, baseUrl });

    try {
      switch (subcommand) {
        case 'create': {
          if (!options.name) {
            return {
              success: false,
              message: '❌ Project name is required. Use --name <name>',
            };
          }

          const businessId = options.businessId || config.get('genii.businessId');
          if (!businessId) {
            return {
              success: false,
              message: '❌ Business ID is required. Use --business-id or run "genii business create" first.',
            };
          }

          logger.info(`📁 Creating project: ${options.name}`);

          const request: CreateProjectRequest = {
            name: options.name,
            description: options.description,
            businessId,
            status: options.status || 'active',
            settings: {},
          };

          const result = await client.createProject(request);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to create project: ${result.error}`,
            };
          }

          // Save default project ID
          config.set('genii.projectId', result.data.id);
          await config.save();

          return {
            success: true,
            message: `✅ Project created: ${result.data.name} (${result.data.id})`,
            data: result.data,
          };
        }

        case 'list': {
          const businessId = options.businessId || config.get('genii.businessId');
          logger.info('📋 Listing projects...');
          const result = await client.listProjects(businessId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to list projects: ${result.error}`,
            };
          }

          const projects = result.data || [];
          if (projects.length === 0) {
            return {
              success: true,
              message: 'No projects found.',
            };
          }

          return {
            success: true,
            message: `Found ${projects.length} project(s):\n${projects.map(p => `  • ${p.name} (${p.id}) [${p.status}]`).join('\n')}`,
            data: projects,
          };
        }

        case 'get': {
          const projectId = args[1] || config.get('genii.projectId');
          if (!projectId) {
            return {
              success: false,
              message: '❌ Project ID required. Use "genii project get <id>" or set default project.',
            };
          }

          logger.info(`🔍 Fetching project: ${projectId}`);
          const result = await client.getProject(projectId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to get project: ${result.error}`,
            };
          }

          return {
            success: true,
            message: `Project: ${result.data.name}\nID: ${result.data.id}\nStatus: ${result.data.status}\nBusiness: ${result.data.businessId}\nCreated: ${result.data.createdAt}`,
            data: result.data,
          };
        }

        default:
          return {
            success: false,
            message: `❌ Unknown subcommand: ${subcommand}. Use: create, list, get`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};
