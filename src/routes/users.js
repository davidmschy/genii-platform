const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/v1/users - Create new user with AI assistant
router.post('/', async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required'
      });
    }
    
    // Create user with AI assistant
    const user = await User.create({
      email,
      name,
      phone,
      assistantConfig: {
        email: `assistant-${email.split('@')[0]}@geniinow.com`,
        // Phone will be generated in create method
      }
    });
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        assistant: {
          email: user.assistant_email,
          phone: user.assistant_phone
        }
      },
      _links: {
        self: { href: `/api/v1/users/${user.id}`, method: 'GET' },
        preferences: { href: `/api/v1/users/${user.id}/preferences`, method: 'PUT' }
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/v1/users/:id - Get user details
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        assistant: {
          email: user.assistant_email,
          phone: user.assistant_phone
        },
        preferences: user.communication_prefs
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PUT /api/v1/users/:id/preferences - Update communication preferences
router.put('/:id/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const user = await User.updatePreferences(req.params.id, preferences);
    
    res.json({
      success: true,
      preferences: user.communication_prefs
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
