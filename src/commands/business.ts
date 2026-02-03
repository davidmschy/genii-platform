import { CommandContext, CommandResult } from 'openclaw';
import { CreateBusinessRequest } from '../types';
import { createClient } from '../api-client';

interface BusinessContext extends CommandContext {
  options: {
    name: string;
    description?: string;
    industry?: string;
    organizationId?: string;
  };
  config: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    save(): Promise<void>;
  };
}

export default {
  name: 'business',
  description: 'Manage Genii businesses',
  usage: 'genii business <subcommand> [options]',
  
  subcommands: ['create', 'list', 'get'],

  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: false,
      description: 'Business name',
    },
    {
      name: 'description',
      alias: 'd',
      type: 'string',
      required: false,
      description: 'Business description',
    },
    {
      name: 'industry',
      alias: 'i',
      type: 'string',
      required: false,
      description: 'Industry (e.g., real-estate, technology, healthcare)',
    },
    {
      name: 'organization-id',
      alias: 'o',
      type: 'string',
      required: false,
      description: 'Organization ID (uses default if not specified)',
    },
  ],

  async execute(context: BusinessContext): Promise<CommandResult> {
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
              message: '❌ Business name is required. Use --name <name>',
            };
          }

          const organizationId = options.organizationId || config.get('genii.organizationId');
          if (!organizationId) {
            return {
              success: false,
              message: '❌ Organization ID is required. Use --organization-id or run "genii org create" first.',
            };
          }

          logger.info(`🏪 Creating business: ${options.name}`);

          const request: CreateBusinessRequest = {
            name: options.name,
            description: options.description,
            industry: options.industry,
            organizationId,
            settings: {},
          };

          const result = await client.createBusiness(request);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to create business: ${result.error}`,
            };
          }

          // Save default business ID
          config.set('genii.businessId', result.data.id);
          await config.save();

          return {
            success: true,
            message: `✅ Business created: ${result.data.name} (${result.data.id})`,
            data: result.data,
          };
        }

        case 'list': {
          const orgId = options.organizationId || config.get('genii.organizationId');
          logger.info('📋 Listing businesses...');
          const result = await client.listBusinesses(orgId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to list businesses: ${result.error}`,
            };
          }

          const businesses = result.data || [];
          if (businesses.length === 0) {
            return {
              success: true,
              message: 'No businesses found.',
            };
          }

          return {
            success: true,
            message: `Found ${businesses.length} business(es):\n${businesses.map(b => `  • ${b.name} (${b.id}) [${b.industry || 'no industry'}]`).join('\n')}`,
            data: businesses,
          };
        }

        case 'get': {
          const businessId = args[1] || config.get('genii.businessId');
          if (!businessId) {
            return {
              success: false,
              message: '❌ Business ID required. Use "genii business get <id>" or set default business.',
            };
          }

          logger.info(`🔍 Fetching business: ${businessId}`);
          const result = await client.getBusiness(businessId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to get business: ${result.error}`,
            };
          }

          return {
            success: true,
            message: `Business: ${result.data.name}\nID: ${result.data.id}\nIndustry: ${result.data.industry || 'N/A'}\nOrg: ${result.data.organizationId}\nCreated: ${result.data.createdAt}`,
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
