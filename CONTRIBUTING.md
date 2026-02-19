# Contributing to Genii Platform

Thank you for your interest in contributing to Genii Platform! This guide will help you get started with contributing code, documentation, or ideas to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Prioritize the project's best interests

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git
- ERPNext instance (for testing)
- TypeScript knowledge

### Local Setup

1. **Fork and clone the repository**:
```bash
git clone https://github.com/YOUR_USERNAME/genii-platform.git
cd genii-platform
```

2. **Add upstream remote**:
```bash
git remote add upstream https://github.com/davidmschy/genii-platform.git
```

3. **Install dependencies**:
```bash
npm install
```

4. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your ERPNext credentials
```

5. **Initialize the database**:
```bash
npm run db:migrate
npm run db:seed  # Optional: load sample data
```

6. **Start the development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Development Workflow

### Creating a Feature Branch

1. **Sync with upstream**:
```bash
git checkout master
git pull upstream master
```

2. **Create a feature branch**:
```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

### Making Changes

1. **Write code** following our style guide
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Run tests locally**:
```bash
npm test
npm run lint
npm run type-check
```

5. **Commit your changes**:
```bash
git add .
git commit -m "feat: add AI employee retry logic"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

6. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

## Code Standards

### TypeScript

- Use strict TypeScript mode
- Define proper interfaces and types
- Avoid `any` type when possible
- Use type inference where appropriate

Example:
```typescript
interface AIEmployee {
  id: string;
  name: string;
  role: 'sales' | 'procurement' | 'accounting';
  status: 'active' | 'paused' | 'failed';
  createdAt: Date;
}

const createEmployee = async (data: Omit<AIEmployee, 'id' | 'createdAt'>): Promise<AIEmployee> => {
  // Implementation
};
```

### Code Organization

```
src/
├── agents/           # AI employee implementations
├── api/              # REST API routes
├── services/         # Business logic
├── models/           # Database models
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── tests/            # Test files
```

### ERPNext Integration

Use the shared ERPNext client:
```typescript
import { erpnext } from '@/services/erpnext';

const customer = await erpnext.getDoc('Customer', 'CUST-001');
const orders = await erpnext.getList('Sales Order', {
  filters: { customer: 'CUST-001', status: 'Draft' },
  fields: ['name', 'grand_total', 'delivery_date']
});
```

### Error Handling

Always use proper error handling:
```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  return { success: false, error: error.message };
}
```

### Async/Await

Prefer async/await over promises:
```typescript
// Good
const data = await fetchData();
process(data);

// Avoid
fetchData().then(data => process(data));
```

## Testing

### Unit Tests

Write unit tests for all business logic:
```typescript
describe('AIEmployee', () => {
  it('should retry failed tasks with exponential backoff', async () => {
    const employee = new AIEmployee({ maxRetries: 3 });
    const result = await employee.executeTask(task);
    expect(result.success).toBe(true);
    expect(result.attempts).toBeLessThanOrEqual(3);
  });
});
```

### Integration Tests

Test ERPNext integration:
```typescript
describe('ERPNext Integration', () => {
  it('should create a sales order', async () => {
    const order = await createSalesOrder({
      customer: 'Test Customer',
      items: [{ item_code: 'ITEM-001', qty: 10 }]
    });
    expect(order.name).toBeDefined();
    expect(order.docstatus).toBe(0); // Draft
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- agents/sales-agent.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guide
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log or debug code
- [ ] TypeScript compiles without errors

### PR Title Format

Use conventional commits format:
```
feat(agents): add inventory reorder AI employee
fix(api): resolve authentication timeout
docs(readme): update setup instructions
```

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code reviewed by myself
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** run (tests, linting, type checking)
2. **Code review** by maintainers
3. **Testing** by reviewer
4. **Approval** or requested changes
5. **Merge** to master

### After Merge

- Your branch will be automatically deleted
- Changes will be included in the next release
- You'll be added to the contributors list

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and ideas
- **Slack**: Real-time chat (invite link in README)
- **Email**: david@geniinow.com for private matters

### Getting Help

- Check existing issues and discussions first
- Provide detailed context in your questions
- Include code samples and error messages
- Be patient and respectful

### Feature Requests

1. Check if the feature already exists or is planned (see ROADMAP.md)
2. Open a GitHub Discussion to gauge interest
3. If there's consensus, create a detailed GitHub Issue
4. Wait for maintainer feedback before implementing

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error messages and stack traces
- Relevant code snippets

## Architecture Decisions

For significant changes, we use Architecture Decision Records (ADRs):

1. Create `docs/adr/NNNN-title.md`
2. Follow the ADR template
3. Discuss in PR review
4. Update ROADMAP.md if needed

## Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Annual contributor spotlight

Thank you for contributing to Genii Platform!
