const express = require('express');
const router = express.Router();

// GET /api/v1/collaboration
router.get('/', (req, res) => {
  res.json({
    message: 'Collaboration endpoint',
    _links: {
      send_message: { href: '/api/v1/collaboration/message', method: 'POST' }
    }
  });
});

// POST /api/v1/collaboration/message
router.post('/message', (req, res) => {
  const { from_agent, to_agent, content, project_id } = req.body;
  
  const message = {
    id: 'msg_' + Date.now(),
    from_agent,
    to_agent,
    content,
    project_id,
    sent_at: new Date().toISOString(),
    _links: {
      reply: { href: '/api/v1/collaboration/message', method: 'POST' }
    }
  };
  
  res.status(201).json(message);
});

module.exports = router;
