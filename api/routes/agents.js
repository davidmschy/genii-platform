const express = require('express');
const router = express.Router();

// GET /api/v1/agents
router.get('/', (req, res) => {
  res.json({
    message: 'Agents endpoint',
    agents: []
  });
});

// POST /api/v1/agents/register
router.post('/register', (req, res) => {
  const { owner_email, agent_type, instance_url } = req.body;
  
  const agent = {
    id: 'agent_' + Date.now(),
    owner_email,
    agent_type,
    instance_url,
    api_key: 'gk_' + Math.random().toString(36).substring(2, 15),
    created_at: new Date().toISOString(),
    _links: {
      spawn: { href: `/api/v1/agents/agent_${Date.now()}/spawn`, method: 'POST' },
      status: { href: `/api/v1/agents/agent_${Date.now()}/status`, method: 'GET' }
    }
  };
  
  res.status(201).json(agent);
});

// POST /api/v1/agents/:id/spawn
router.post('/:id/spawn', (req, res) => {
  const { role, task, project_id } = req.body;
  
  const subAgent = {
    id: 'subagent_' + Date.now(),
    parent_agent: req.params.id,
    role,
    task,
    project_id,
    status: 'running',
    spawned_at: new Date().toISOString(),
    _links: {
      status: { href: `/api/v1/agents/subagent_${Date.now()}/status`, method: 'GET' },
      result: { href: `/api/v1/agents/subagent_${Date.now()}/result`, method: 'GET' }
    }
  };
  
  res.status(201).json(subAgent);
});

module.exports = router;
