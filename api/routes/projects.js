const express = require('express');
const router = express.Router();

// GET /api/v1/projects
router.get('/', (req, res) => {
  res.json({
    message: 'Projects endpoint',
    projects: []
  });
});

// POST /api/v1/projects
router.post('/', (req, res) => {
  const { name, business_id, status = 'active' } = req.body;
  
  const project = {
    id: 'proj_' + Date.now(),
    name,
    business_id,
    status,
    created_at: new Date().toISOString(),
    _links: {
      spawn_agent: { href: '/api/v1/agents/spawn', method: 'POST' },
      messages: { href: `/api/v1/projects/proj_${Date.now()}/messages`, method: 'GET' }
    }
  };
  
  res.status(201).json(project);
});

// GET /api/v1/projects/:id
router.get('/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Example Project',
    status: 'active',
    _actions: [
      { rel: 'spawn_research_agent', description: 'Spawn agent to research topic' },
      { rel: 'spawn_analysis_agent', description: 'Spawn agent to analyze data' },
      { rel: 'message_collaborators', description: 'Message other agents on project' }
    ]
  });
});

module.exports = router;
