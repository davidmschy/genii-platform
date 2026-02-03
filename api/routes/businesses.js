const express = require('express');
const router = express.Router();

// GET /api/v1/businesses
router.get('/', (req, res) => {
  res.json({
    message: 'Businesses endpoint',
    businesses: []
  });
});

// POST /api/v1/businesses
router.post('/', (req, res) => {
  const { name, organization_id, type } = req.body;
  
  const business = {
    id: 'biz_' + Date.now(),
    name,
    organization_id,
    type,
    created_at: new Date().toISOString(),
    _links: {
      projects: { href: `/api/v1/businesses/biz_${Date.now()}/projects`, method: 'GET' },
      create_project: { href: '/api/v1/projects', method: 'POST' }
    }
  };
  
  res.status(201).json(business);
});

module.exports = router;
