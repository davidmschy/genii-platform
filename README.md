# OpenClaw Genii Plugin

OpenClaw plugin for Genii AI Platform integration. Manage organizations, businesses, projects, and spawn AI agents directly from OpenClaw.

## Installation

```bash
npm install openclaw-plugin-genii
```

## Configuration

Add to your OpenClaw configuration:

```json
{
  "plugins": [
    "openclaw-plugin-genii"
  ]
}
```

## Usage

### Connect to Genii API

```bash
genii connect --api-key YOUR_API_KEY --save
```

### Organization Management

```bash
# Create organization
genii org create --name "My Organization" --description "Description"

# List organizations
genii org list

# Get organization details
genii org get <organization-id>
```

### Business Management

```bash
# Create business
genii business create --name "My Business" --industry technology

# List businesses
genii business list

# Get business details
genii business get <business-id>
```

### Project Management

```bash
# Create project
genii project create --name "My Project" --status active

# List projects
genii project list

# Get project details
genii project get <project-id>
```

### Agent Management

```bash
# Spawn an agent
genii agent spawn --name "Assistant" --role assistant --model gpt-4

# List agents
genii agent list

# Chat with agent
genii agent chat <agent-id> "Hello!"

# Get agent details
genii agent get <agent-id>
```

## Environment Variables

- `GENII_API_KEY` - Your Genii API key
- `GENII_BASE_URL` - Genii API base URL (default: https://api.genii.ai/v1)

## API Client

The plugin exports a TypeScript API client for programmatic use:

```typescript
import { createClient } from 'openclaw-plugin-genii';

const client = createClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.genii.ai/v1'
});

// Create organization
const org = await client.createOrganization({ name: 'My Org' });

// Spawn agent
const agent = await client.spawnAgent({
  name: 'Helper',
  role: 'assistant',
  projectId: 'proj-123'
});
```

## License

MIT
