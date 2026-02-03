import { Plugin, CommandRegistry, ConfigManager, Logger } from 'openclaw';
import connectCommand from './commands/connect';
import orgCommand from './commands/org';
import businessCommand from './commands/business';
import projectCommand from './commands/project';
import agentSpawnCommand from './commands/agent-spawn';

export interface GeniiPluginContext {
  config: ConfigManager;
  logger: Logger;
}

/**
 * Genii Plugin for OpenClaw
 * 
 * Provides integration with the Genii AI platform for:
 * - Organization management
 * - Business management  
 * - Project management
 * - AI agent spawning and management
 */
class GeniiPlugin implements Plugin {
  name = 'genii';
  version = '1.0.0';
  description = 'Genii AI Platform Integration';
  
  private config: ConfigManager;
  private logger: Logger;

  async initialize(context: { config: ConfigManager; logger: Logger }): Promise<void> {
    this.config = context.config;
    this.logger = context.logger;
    
    this.logger.info('🔌 Genii plugin initialized');
  }

  async registerCommands(registry: CommandRegistry): Promise<void> {
    this.logger.info('📋 Registering Genii commands...');

    // Register main namespace command
    registry.registerCommand({
      name: 'genii',
      description: 'Genii AI Platform integration',
      usage: 'genii <command> [options]',
      subcommands: ['connect', 'org', 'business', 'project', 'agent'],
      async execute(context) {
        return {
          success: true,
          message: `Genii AI Platform v1.0.0

Available commands:
  genii connect    - Connect to Genii API
  genii org        - Manage organizations
  genii business   - Manage businesses
  genii project    - Manage projects
  genii agent      - Spawn and manage AI agents

Run "genii <command> --help" for more information.`,
        };
      },
    });

    // Register subcommands
    registry.registerCommand(connectCommand);
    registry.registerCommand(orgCommand);
    registry.registerCommand(businessCommand);
    registry.registerCommand(projectCommand);
    registry.registerCommand(agentSpawnCommand);

    // Register alias: genii agent spawn -> genii agent-spawn
    registry.registerCommand({
      name: 'agent',
      description: 'Manage Genii AI agents',
      usage: 'genii agent <subcommand> [options]',
      subcommands: ['spawn', 'list', 'get', 'chat'],
      async execute(context) {
        const subcommand = context.args[0];
        
        if (!subcommand) {
          return {
            success: true,
            message: `Genii Agent Management

Subcommands:
  genii agent spawn  - Spawn a new AI agent
  genii agent list   - List agents
  genii agent get    - Get agent details
  genii agent chat   - Chat with an agent`,
          };
        }

        // Delegate to agent-spawn command
        return agentSpawnCommand.execute({
          ...context,
          args: [subcommand, ...context.args.slice(1)],
        });
      },
    });

    this.logger.info('✅ Genii commands registered');
  }

  async onActivate(): Promise<void> {
    this.logger.info('✨ Genii plugin activated');
    
    // Check if credentials are configured
    const apiKey = this.config.get('genii.apiKey');
    if (apiKey) {
      this.logger.info('🔑 Genii API credentials found');
    } else {
      this.logger.info('ℹ️  No Genii API credentials. Run "genii connect --api-key <key>" to authenticate.');
    }
  }

  async onDeactivate(): Promise<void> {
    this.logger.info('👋 Genii plugin deactivated');
  }
}

// Export plugin instance
export default new GeniiPlugin();

// Export types and client for external use
export * from './types';
export { GeniiApiClient, createClient } from './api-client';
