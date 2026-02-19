# Genii Platform

An AI-powered business operations platform that transforms how SMBs manage their entire enterprise—from sales and finance to inventory and projects—through intelligent automation and autonomous AI employees.

## What is Genii?

Genii is an AI-native ERP platform designed specifically for small and medium-sized businesses. Built on TypeScript and deeply integrated with ERPNext, Genii replaces manual, repetitive workflows with persistent AI employees that learn, adapt, and execute complex business processes 24/7.

Instead of forcing your team to learn complex ERP systems, Genii speaks your language—natural conversations that trigger sophisticated multi-step workflows across sales, procurement, accounting, inventory, and project management.

## Key Features

### 🤖 AI Employees
- **Persistent, always-on workers** that handle end-to-end business processes
- **Self-healing diagnostics** that detect failures, retry with exponential backoff, and escalate exceptions
- **Continuous learning** from past errors and workflow patterns
- **Multi-step decision trees** with exception handling and context preservation

### ⚡ Automated Workflows
- **Order-to-cash automation**: Quote → Sales Order → Delivery → Invoice → Payment
- **Procure-to-pay**: Requisition → PO → Receipt → Invoice → Payment
- **Lead-to-customer**: Capture → Qualify → Nurture → Convert → Onboard
- **Inventory management**: Stock transfers, reorder triggers, multi-warehouse coordination

### 🔗 ERPNext Integration
- **Native REST API client** for all ERPNext DocTypes (Customers, Orders, Invoices, Projects, etc.)
- **Real-time data sync** with bidirectional updates
- **Custom method execution** for advanced business logic
- **File attachment handling** for documents and audit trails

### 🏢 Multi-Company Support
- **Unified interface** across multiple legal entities
- **Consolidated reporting** and cross-company analytics
- **Inter-company transactions** and transfer pricing
- **Role-based access control** per company

### 📊 Real-Time Intelligence
- **KPI dashboards** with trend visualization and threshold alerts
- **Predictive analytics** for inventory, cash flow, and sales forecasting
- **Anomaly detection** for budget variances and compliance risks
- **Natural language queries** for instant business insights

### 🔔 Smart Notifications
- **Slack and email integration** for alerts and approvals
- **Context-rich escalations** with full audit trails
- **Configurable routing rules** by priority, role, and threshold
- **Team collaboration** with threaded conversations

## Tech Stack

### Core Platform
- **TypeScript** - Type-safe application logic and API integrations
- **Node.js** - Runtime for backend services and workflow orchestration
- **React** - Modern, responsive user interface
- **Express** - RESTful API server

### AI & Automation
- **OpenAI GPT-4** - Natural language understanding and generation
- **LangChain** - AI agent orchestration and memory management
- **Temporal** (planned) - Durable workflow execution

### Data & Integration
- **ERPNext** - Core ERP system via REST API
- **PostgreSQL** - Workflow state, audit logs, and analytics
- **Redis** - Caching and real-time event processing

### DevOps
- **Docker** - Containerized deployment
- **GitHub Actions** - CI/CD pipelines
- **Sentry** - Error tracking and performance monitoring

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Redis 7+
- ERPNext instance (v14 or v15)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/davidmschy/genii-platform.git
   cd genii-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   See [Environment Variables](#environment-variables) below.

4. **Initialize the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the platform**
   - UI: http://localhost:3000
   - API: http://localhost:3001

### Environment Variables

Create a `.env` file in the project root with the following:

```bash
# Application
NODE_ENV=development
PORT=3001
UI_PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/genii_platform
REDIS_URL=redis://localhost:6379

# ERPNext Integration
ERPNEXT_URL=https://your-erpnext-instance.com
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here

# AI Services
OPENAI_API_KEY=your_openai_key_here
LANGCHAIN_API_KEY=your_langchain_key_here

# Notifications
SLACK_BOT_TOKEN=xoxb-your-slack-token
SLACK_SIGNING_SECRET=your_signing_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@geniinow.com
SMTP_PASSWORD=your_email_password

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Monitoring
SENTRY_DSN=your_sentry_dsn_here
```

## Development

### Project Structure
```
genii-platform/
├── src/
│   ├── agents/          # AI employee definitions
│   ├── api/             # REST API routes
│   ├── integrations/    # ERPNext, Slack, email clients
│   ├── workflows/       # Business process definitions
│   ├── models/          # Database models
│   ├── services/        # Core business logic
│   └── ui/              # React frontend
├── tests/               # Unit and integration tests
├── migrations/          # Database schema versions
└── docs/                # API documentation
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm start` - Run production server
- `npm test` - Run test suite
- `npm run lint` - Lint TypeScript code
- `npm run typecheck` - Type check without emitting

## Product Roadmap

### Phase 1: Foundation (Q1 2026) ✅
- [x] ERPNext REST API client with full CRUD
- [x] Multi-company data isolation and access control
- [x] Core AI agent framework with memory and context
- [x] Basic workflow orchestration (order-to-cash, procure-to-pay)
- [x] Slack and email notification infrastructure
- [x] Initial React dashboard with KPI widgets

### Phase 2: Intelligence (Q2–Q3 2026) 🚧
- [ ] Self-healing AI employees with diagnostic logic
- [ ] Predictive analytics for inventory, cash flow, sales pipeline
- [ ] Natural language query interface for business data
- [ ] Advanced workflow builder (visual drag-and-drop)
- [ ] Mobile-responsive UI with offline support
- [ ] Webhook integrations for Stripe, Plaid, Shopify
- [ ] Multi-currency and multi-language support

### Phase 3: Scale (Q4 2026) 📋
- [ ] Temporal workflow engine for durable execution
- [ ] Marketplace for pre-built AI employees and workflows
- [ ] Advanced role-based permissions with approval chains
- [ ] Real-time collaboration with live document editing
- [ ] Custom reporting builder with pivot tables and charts
- [ ] API rate limiting, caching, and performance optimization
- [ ] SOC 2 Type II compliance and security audit

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright © 2026 Genii AI. All rights reserved.

## Support

- **Documentation**: https://docs.geniinow.com
- **Email**: support@geniinow.com
- **Slack**: [Join our community](https://geniinow.slack.com)

---

Built with ❤️ by the Genii team