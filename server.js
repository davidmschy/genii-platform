const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('frontend'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Discovery (HATEOAS)
app.get('/api/v1/discover', (req, res) => {
  res.json({
    name: "Genii AI Workforce Platform",
    version: "1.0.0",
    status: "live",
    _links: {
      agents: { href: "/api/v1/agents", method: "GET" },
      companies: { href: "/api/v1/companies", method: "GET" },
      auth: { href: "/api/v1/auth/signup", method: "POST" }
    },
    modules: [
      { name: "finance", status: "active", features: ["invoicing", "payments", "recurring"] },
      { name: "crm", status: "beta", features: ["contacts", "leads"] },
      { name: "helpdesk", status: "coming_soon" }
    ]
  });
});

// Agents endpoint
app.get('/api/v1/agents', (req, res) => {
  res.json({
    agents: [
      {
        id: "sarah",
        name: "Sarah Chen",
        role: "Content Marketing Manager",
        email: "sarah@geniiai.com",
        phone: "+1-555-GENII-01",
        hourly_rate: 25,
        capabilities: ["write_blog", "social_media", "email_campaigns"],
        status: "available",
        avatar: "?????"
      },
      {
        id: "john",
        name: "John Miller",
        role: "Sales Development Rep",
        email: "john@geniiai.com",
        phone: "+1-555-GENII-02",
        hourly_rate: 20,
        capabilities: ["lead_qualification", "demo_scheduling", "proposals"],
        status: "available",
        avatar: "?????"
      },
      {
        id: "mike",
        name: "Mike Torres",
        role: "UI/UX Designer",
        email: "mike@geniiai.com",
        hourly_rate: 30,
        capabilities: ["logo_design", "ui_mockups", "brand_guidelines"],
        status: "available",
        avatar: "??"
      }
    ]
  });
});

// Signup endpoint
app.post('/api/v1/auth/signup', (req, res) => {
  const { email, company } = req.body;
  res.json({
    success: true,
    message: "Welcome to Genii AI!",
    company_id: "gen_" + Date.now(),
    api_key: "gk_" + Math.random().toString(36).substring(2, 15),
    next_steps: [
      "Check your email for verification",
      "Meet Sarah, your first AI employee",
      "Start delegating tasks"
    ],
    _links: {
      dashboard: "/dashboard",
      invite_agents: "/api/v1/agents/hire"
    }
  });
});

// Hire agent endpoint
app.post('/api/v1/agents/hire', (req, res) => {
  const { agent_id } = req.body;
  res.json({
    success: true,
    message: `You've hired ${agent_id}!`,
    onboarding: {
      email: `${agent_id}@geniiai.com`,
      slack: `@${agent_id}`,
      phone: `+1-555-GENII-0${Math.floor(Math.random() * 9) + 1}`
    },
    first_task: "Send a welcome message to get started"
  });
});

// Start server
app.listen(port, () => {
  console.log(`Genii AI Platform running on port ${port}`);
});
