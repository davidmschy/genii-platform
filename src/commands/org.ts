import { CommandContext, CommandResult } from 'openclaw';
import { CreateOrganizationRequest } from '../types';
import { createClient } from '../api-client';

interface OrgContext extends CommandContext {
  options: {
    name: string;
    description?: string;
  };
  config: {
    get(key: string): string | undefined;
  };
}

export default {
  name: 'org',
  description: 'Manage Genii organizations',
  usage: 'genii org <subcommand> [options]',
  
  subcommands: ['create', 'list', 'get'],

  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: false,
      description: 'Organization name',
    },
    {
      name: 'description',
      alias: 'd',
      type: 'string',
      required: false,
      description: 'Organization description',
    },
  ],

  async execute(context: OrgContext): Promise<CommandResult> {
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
              message: '❌ Organization name is required. Use --name <name>',
            };
          }

          logger.info(`🏢 Creating organization: ${options.name}`);

          const request: CreateOrganizationRequest = {
            name: options.name,
            description: options.description,
          };

          const result = await client.createOrganization(request);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to create organization: ${result.error}`,
            };
          }

          // Save default org ID
          config.set('genii.organizationId', result.data.id);
          await config.save();

          return {
            success: true,
            message: `✅ Organization created: ${result.data.name} (${result.data.id})`,
            data: result.data,
          };
        }

        case 'list': {
          logger.info('📋 Listing organizations...');
          const result = await client.listOrganizations();

          if (!result.success) {
            return {
              success: false,
              message: `Failed to list organizations: ${result.error}`,
            };
          }

          const orgs = result.data || [];
          if (orgs.length === 0) {
            return {
              success: true,
              message: 'No organizations found.',
            };
          }

          return {
            success: true,
            message: `Found ${orgs.length} organization(s):\n${orgs.map(o => `  • ${o.name} (${o.id})`).join('\n')}`,
            data: orgs,
          };
        }

        case 'get': {
          const orgId = args[1] || config.get('genii.organizationId');
          if (!orgId) {
            return {
              success: false,
              message: '❌ Organization ID required. Use "genii org get <id>" or set default org.',
            };
          }

          logger.info(`🔍 Fetching organization: ${orgId}`);
          const result = await client.getOrganization(orgId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to get organization: ${result.error}`,
            };
          }

          return {
            success: true,
            message: `Organization: ${result.data.name}\nID: ${result.data.id}\nCreated: ${result.data.createdAt}`,
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
