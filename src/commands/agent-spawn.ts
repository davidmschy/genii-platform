import { CommandContext, CommandResult } from 'openclaw';
import { SpawnAgentRequest } from '../types';
import { createClient } from '../api-client';

interface AgentSpawnContext extends CommandContext {
  options: {
    name: string;
    role: string;
    projectId?: string;
    model?: string;
    systemPrompt?: string;
    capabilities?: string;
  };
  config: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    save(): Promise<void>;
  };
}

export default {
  name: 'agent-spawn',
  description: 'Spawn AI agents within Genii projects',
  usage: 'genii agent spawn [options]',
  aliases: ['spawn'],

  options: [
    {
      name: 'name',
      alias: 'n',
      type: 'string',
      required: false,
      description: 'Agent name',
    },
    {
      name: 'role',
      alias: 'r',
      type: 'string',
      required: false,
      description: 'Agent role (e.g., ceo, developer, analyst, assistant)',
    },
    {
      name: 'project-id',
      alias: 'p',
      type: 'string',
      required: false,
      description: 'Project ID (uses default if not specified)',
    },
    {
      name: 'model',
      alias: 'm',
      type: 'string',
      required: false,
      description: 'AI model (gpt-4, gpt-4-turbo, claude-3-opus, etc.)',
    },
    {
      name: 'system-prompt',
      alias: 's',
      type: 'string',
      required: false,
      description: 'System prompt for the agent',
    },
    {
      name: 'capabilities',
      alias: 'c',
      type: 'string',
      required: false,
      description: 'Comma-separated capabilities (e.g., "web-search,code-execution,file-access")',
    },
  ],

  async execute(context: AgentSpawnContext): Promise<CommandResult> {
    const { options, args, logger, config } = context;
    const subcommand = args[0] || 'spawn';

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
        case 'spawn':
        case 'create': {
          if (!options.name) {
            return {
              success: false,
              message: '❌ Agent name is required. Use --name <name>',
            };
          }

          if (!options.role) {
            return {
              success: false,
              message: '❌ Agent role is required. Use --role <role>',
            };
          }

          const projectId = options.projectId || config.get('genii.projectId');
          if (!projectId) {
            return {
              success: false,
              message: '❌ Project ID is required. Use --project-id or run "genii project create" first.',
            };
          }

          logger.info(`🤖 Spawning agent: ${options.name} (${options.role})`);

          const capabilities = options.capabilities
            ? options.capabilities.split(',').map(c => c.trim())
            : [];

          const request: SpawnAgentRequest = {
            name: options.name,
            role: options.role,
            projectId,
            model: options.model || 'gpt-4',
            systemPrompt: options.systemPrompt,
            capabilities,
            config: {
              autoStart: true,
              logLevel: 'info',
            },
          };

          const result = await client.spawnAgent(request);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to spawn agent: ${result.error}`,
            };
          }

          // Save default agent ID
          config.set('genii.agentId', result.data.id);
          await config.save();

          const agent = result.data;
          return {
            success: true,
            message: `✅ Agent spawned: ${agent.name} (${agent.id})\nRole: ${agent.role}\nModel: ${agent.model}\nStatus: ${agent.status}\nCapabilities: ${agent.capabilities.join(', ') || 'none'}`,
            data: agent,
          };
        }

        case 'list': {
          const projectId = options.projectId || config.get('genii.projectId');
          logger.info('📋 Listing agents...');
          const result = await client.listAgents(projectId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to list agents: ${result.error}`,
            };
          }

          const agents = result.data || [];
          if (agents.length === 0) {
            return {
              success: true,
              message: 'No agents found.',
            };
          }

          return {
            success: true,
            message: `Found ${agents.length} agent(s):\n${agents.map(a => `  • ${a.name} (${a.id}) [${a.role}] - ${a.status}`).join('\n')}`,
            data: agents,
          };
        }

        case 'get': {
          const agentId = args[1] || config.get('genii.agentId');
          if (!agentId) {
            return {
              success: false,
              message: '❌ Agent ID required. Use "genii agent get <id>" or set default agent.',
            };
          }

          logger.info(`🔍 Fetching agent: ${agentId}`);
          const result = await client.getAgent(agentId);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to get agent: ${result.error}`,
            };
          }

          const agent = result.data;
          return {
            success: true,
            message: `Agent: ${agent.name}\nID: ${agent.id}\nRole: ${agent.role}\nModel: ${agent.model}\nStatus: ${agent.status}\nProject: ${agent.projectId}\nCapabilities: ${agent.capabilities.join(', ') || 'none'}\nCreated: ${agent.createdAt}`,
            data: agent,
          };
        }

        case 'chat': {
          const agentId = args[1] || config.get('genii.agentId');
          const message = args.slice(2).join(' ');
          
          if (!agentId) {
            return {
              success: false,
              message: '❌ Agent ID required. Use "genii agent chat <id> <message>" or set default agent.',
            };
          }

          if (!message) {
            return {
              success: false,
              message: '❌ Message required. Use "genii agent chat <id> <message>"',
            };
          }

          logger.info(`💬 Sending message to agent ${agentId}...`);
          const result = await client.sendMessage(agentId, message);

          if (!result.success) {
            return {
              success: false,
              message: `Failed to send message: ${result.error}`,
            };
          }

          return {
            success: true,
            message: result.data.response,
            data: result.data,
          };
        }

        default:
          return {
            success: false,
            message: `❌ Unknown subcommand: ${subcommand}. Use: spawn, create, list, get, chat`,
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
