import { CommandContext, CommandResult } from 'openclaw';
import { ConnectOptions } from '../types';
import { GeniiApiClient, createClient } from '../api-client';

interface ConnectContext extends CommandContext {
  options: ConnectOptions;
  config: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    save(): Promise<void>;
  };
}

export default {
  name: 'connect',
  description: 'Connect to Genii API with your credentials',
  usage: 'genii connect --api-key <key> [--base-url <url>] [--save]',
  
  options: [
    {
      name: 'api-key',
      alias: 'k',
      type: 'string',
      required: true,
      description: 'Your Genii API key',
    },
    {
      name: 'base-url',
      alias: 'u',
      type: 'string',
      required: false,
      description: 'Genii API base URL (default: https://api.genii.ai/v1)',
    },
    {
      name: 'save',
      alias: 's',
      type: 'boolean',
      required: false,
      description: 'Save credentials to config file',
    },
  ],

  async execute(context: ConnectContext): Promise<CommandResult> {
    const { options, logger, config } = context;
    
    logger.info('🔌 Connecting to Genii API...');

    try {
      const clientConfig = {
        apiKey: options.apiKey,
        baseUrl: options.baseUrl || 'https://api.genii.ai/v1',
      };

      const client = createClient(clientConfig);
      
      // Test connection
      const health = await client.health();
      
      if (!health.success) {
        return {
          success: false,
          message: `Failed to connect: ${health.error}`,
        };
      }

      // Save credentials if requested
      if (options.save) {
        config.set('genii.apiKey', options.apiKey);
        if (options.baseUrl) {
          config.set('genii.baseUrl', options.baseUrl);
        }
        await config.save();
        logger.info('✅ Credentials saved to config');
      }

      return {
        success: true,
        message: `✅ Connected to Genii API (v${health.data?.version || 'unknown'})`,
        data: {
          status: health.data?.status,
          version: health.data?.version,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};
