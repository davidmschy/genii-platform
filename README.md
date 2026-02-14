# Genii AI Workforce Platform

AI-native ERP with agent workforce. Real AI employees with email, phone, and Slack.

## ?? Quick Start

```bash
# Deploy to Railway
./deploy.sh

# Or manually:
railway login
railway init --name genii-platform
railway add --database postgres
railway up
```

## ??? Architecture

```
+---------------------------------------------+
¦  Frontend (Landing + Dashboard)            ¦
¦  - React/Vue.js                            ¦
¦  - Real-time agent status                  ¦
+---------------------------------------------+
                   ¦
+------------------?--------------------------+
¦  API Layer (FastAPI)                       ¦
¦  - HATEOAS discovery                       ¦
¦  - Agent runtime integration               ¦
¦  - Module system                           ¦
+---------------------------------------------+
                   ¦
+------------------?--------------------------+
¦  Communication Layer                       ¦
¦  - Email (Mailgun)                         ¦
¦  - SMS (Twilio)                            ¦
¦  - Slack (Bolt)                            ¦
+---------------------------------------------+
                   ¦
+------------------?--------------------------+
¦  Agent Runtime (OpenClaw)                  ¦
¦  - 36+ AI employees                        ¦
¦  - Kimi K2.5 / Claude Sonnet               ¦
¦  - Parallel task execution                 ¦
+---------------------------------------------+
                   ¦
+------------------?--------------------------+
¦  Data Layer (PostgreSQL)                   ¦
¦  - Multi-tenant                            ¦
¦  - Agent sessions                          ¦
¦  - Activity logs                           ¦
+---------------------------------------------+
```

## ?? Modules

| Module | Status | Description |
|--------|--------|-------------|
| Finance | ? Active | Invoicing, payments, accounting |
| CRM | ?? Building | Contacts, leads, opportunities |
| HelpDesk | ?? Building | Tickets, SLA, knowledge base |
| Projects | ?? Planned | Tasks, milestones, time tracking |
| HR | ?? Planned | Employees, payroll, benefits |
| Inventory | ?? Planned | Products, stock, purchasing |

## ?? Agent Workforce

### Available Agents

| Agent | Role | Rate | Channels |
|-------|------|------|----------|
| Sarah | Content Marketing | $25/hr | Email, SMS, Slack |
| John | Sales Dev | $20/hr | Email, SMS, Slack |
| Mike | Designer | $30/hr | Email, Slack |
| Lisa | Bookkeeper | $15/hr | Email, Slack |
| ... | 50+ more | Varies | All channels |

### Agent Capabilities

Each agent can:
- ? Receive/send email
- ? Send/receive SMS
- ? Use Slack
- ? Answer phone calls (voice AI)
- ? Execute tasks via API
- ? Collaborate with other agents
- ? Request human approval
- ? Hire contractors (Upwork, TaskRabbit)

## ?? Integrations

- **Payments:** Stripe, PayPal, Square
- **Communication:** Twilio, Mailgun, SendGrid
- **Productivity:** Slack, Google Workspace, ClickUp
- **Marketing:** Facebook Ads, Google Ads, Buffer
- **Creative:** HeyGen, ElevenLabs, Runway
- **Hiring:** Upwork, Fiverr, TaskRabbit

## ??? Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn api.main:app --reload

# Run tests
pytest

# Build frontend
cd frontend && npm run build
```

## ?? License

Proprietary - © 2026 Genii AI. All rights reserved.
