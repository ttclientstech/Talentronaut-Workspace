# Contributing to AI powered Work Manager

Thank you for considering contributing to this project! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- MongoDB (local or Atlas)
- pnpm package manager
- Git

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd "AI powered Work Manager"
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Code Standards

### TypeScript
- Use TypeScript for all new code
- Avoid using `any` type - use proper types or `unknown`
- Export interfaces and types when they're used in multiple files
- Use non-null assertions (`!`) only when you're certain the value exists

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Use trailing commas in multi-line objects and arrays

### File Organization
- Place API routes in `app/api/`
- Place reusable components in `components/`
- Place utilities in `lib/utils/`
- Place models in `lib/models/`
- Place middleware in `lib/middleware/`

## Git Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Commit Messages
Use conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(tasks): add AI-powered task assignment
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow the code standards
   - Add comments for complex logic

3. **Test Your Changes**
   ```bash
   pnpm build
   ```
   - Ensure no TypeScript errors
   - Test functionality manually
   - Verify no regressions

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Provide a clear description
   - Reference related issues
   - Include screenshots if UI changes

## Testing Guidelines

### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Responsive design works
- [ ] All user roles tested (Admin, Lead, Member)
- [ ] Error handling works properly
- [ ] No TypeScript errors: `pnpm build`

### API Testing
- Test all endpoints with different user roles
- Test error cases (invalid input, unauthorized access)
- Verify database operations are correct
- Check response formats match expectations

## Security Guidelines

### Authentication
- Never expose JWT secrets
- Always validate user input
- Use bcrypt for password hashing
- Implement proper role-based access control

### Database
- Sanitize all database queries
- Use Mongoose schema validation
- Never expose sensitive data in responses
- Use environment variables for credentials

### API Endpoints
- Validate all input parameters
- Check user authentication and authorization
- Use appropriate HTTP status codes
- Handle errors gracefully

## Adding New Features

### New API Endpoint
1. Create route in `app/api/[resource]/route.ts`
2. Add authentication middleware
3. Validate input parameters
4. Implement business logic
5. Return appropriate responses
6. Test with different user roles

### New UI Component
1. Create component in `components/`
2. Use TypeScript for props
3. Follow existing component patterns
4. Make it responsive
5. Add proper accessibility attributes
6. Test in different screen sizes

### New Database Model
1. Create model in `lib/models/`
2. Define schema with validation
3. Add indexes for performance
4. Export TypeScript interface
5. Add necessary hooks (pre/post save)
6. Document the schema

## Code Review

### What We Look For
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it clean and maintainable?
- **Type Safety**: Proper TypeScript usage?
- **Security**: No vulnerabilities introduced?
- **Performance**: Efficient implementation?
- **Documentation**: Clear comments and docs?

### Review Process
1. Automated checks run on PR creation
2. Maintainer reviews code
3. Address feedback and comments
4. Maintainer approves and merges

## Common Issues

### TypeScript Errors
```bash
# Clear build cache
rm -rf .next

# Rebuild
pnpm build
```

### Mongoose Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure IP is whitelisted (Atlas)

### Environment Variables Not Loading
- Restart development server
- Check variable names match
- Ensure .env.local exist

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [React Documentation](https://react.dev/)

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search closed issues
3. Open a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
