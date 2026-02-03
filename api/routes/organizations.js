const express = require('express');
const router = express.Router();

// GET /api/v1/organizations
router.get('/', (req, res) => {
  res.json({
    message: 'Organizations endpoint',
    _links: {
      create: { href: '/api/v1/organizations', method: 'POST' }
    }
  });
});

// POST /api/v1/organizations
router.post('/', (req, res) => {
  const { name, owner_email } = req.body;
  
  // TODO: Create organization in database
  const org = {
    id: 'org_' + Date.now(),
    name,
    owner_email,
    created_at: new Date().toISOString(),
    _links: {
      self: { href: `/api/v1/organizations/org_${Date.now()}`, method: 'GET' },
      create_business: { href: '/api/v1/businesses', method: 'POST' },
      invite_member: { href: `/api/v1/organizations/org_${Date.now()}/invites`, method: 'POST' }
    }
  };
  
  res.status(201).json(org);
});

// GET /api/v1/organizations/:id
router.get('/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Example Organization',
    _links: {
      businesses: { href: `/api/v1/organizations/${req.params.id}/businesses`, method: 'GET' },
      agents: { href: `/api/v1/organizations/${req.params.id}/agents`, method: 'GET' }
    }
  });
});

module.exports = router;
