<<<<<<< HEAD
# AI powered Work Manager

A modern, full-stack AI powered Work Manager application built with Next.js 16, TypeScript, MongoDB, and AI-powered task assignment.

## Features

### Core Functionality
- **Multi-Organization Support** - Users can belong to multiple organizations with different roles
- **Role-Based Access Control** - Admin, Lead, and Member roles with specific permissions
- **Project Management** - Create, manage, and track projects with team members
- **Task Management** - Create, assign, and track tasks with status updates and priorities
- **AI-Powered Task Assignment** - Intelligent task assignment using Google's Gemini AI
- **Member Management** - Invite, approve, and manage team members
- **Real-time Updates** - Track project progress and task completion
- **Drag & Drop Interface** - Intuitive task management with drag-and-drop functionality

### Technical Features
- **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- **Environment Validation** - Automatic validation of required environment variables on startup
- **TypeScript** - Full type safety across the entire application
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS
- **Modern UI Components** - Built with Radix UI and shadcn/ui
- **MongoDB Integration** - Robust data persistence with Mongoose ODM
- **CI/CD Pipeline** - Automated deployment with GitHub Actions to AWS EC2
- **Zero-Downtime Deployment** - PM2 cluster mode with automatic rollback on failure

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcryptjs
- **AI Integration**: Google Gemini AI
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm

## Prerequisites

- **Node.js** 20.x or higher (required for Next.js 16)
- **MongoDB** (Local installation or MongoDB Atlas account)
- **pnpm** (or npm/yarn)
- **Google Gemini API Key** (for AI features)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "AI powered Work Manager"
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install --legacy-peer-deps
```

### 3. Set Up MongoDB

**Option A: Local MongoDB**

1. Download and install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows (as Administrator)
   net start MongoDB

   # macOS/Linux
   sudo systemctl start mongod
   ```
3. Verify MongoDB is running:
   ```bash
   mongosh
   ```

**Option B: MongoDB Atlas (Cloud)**

1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Whitelist your IP address
4. Create a database user
5. Get your connection string

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/work-management
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/work-management

# JWT Secret - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-generated-64-character-secret-here

# JWT Token Expiration (optional)
JWT_EXPIRES_IN=7d

# Gemini AI API Key - Get from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# Node Environment
NODE_ENV=development

# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Build the Application

```bash
pnpm build
# or
npm run build
```

### 6. Start the Development Server

```bash
pnpm dev
# or
npm run dev
```

The application will be available at http://localhost:3000

## Production Deployment

### CI/CD with GitHub Actions (Recommended)

Automated deployment to AWS EC2 with zero-downtime updates:

**Quick Start**: [docs/QUICK-START-CICD.md](docs/QUICK-START-CICD.md)
**Full Guide**: [docs/CI-CD-SETUP.md](docs/CI-CD-SETUP.md)

**Features:**
- ✅ Automated testing on every push
- ✅ Automated deployment to AWS EC2
- ✅ Zero-downtime deployments with PM2
- ✅ Automatic rollback on failure
- ✅ SSL certificate management
- ✅ Nginx reverse proxy with rate limiting

**Setup time**: ~30 minutes

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t2.medium)
# 2. Run setup script
scp -i your-key.pem scripts/setup-ec2.sh ubuntu@EC2_IP:~/
ssh -i your-key.pem ubuntu@EC2_IP "./setup-ec2.sh"

# 3. Configure GitHub Secrets (see docs)
# 4. Push to main branch → Automatic deployment!
```

### Manual Deployment

#### Environment Variables

Ensure all required environment variables are set:
- `MONGODB_URI` - Your production MongoDB connection string
- `JWT_SECRET` - A secure, randomly generated secret (min 32 characters)
- `GEMINI_API_KEY` - Your Google Gemini API key
- `NODE_ENV` - Set to `production`
- `NEXT_PUBLIC_API_URL` - Your production URL

The application includes automatic environment variable validation that will prevent startup if required variables are missing or insecure.

#### Build for Production

```bash
pnpm build
pnpm start
```

#### Other Deployment Platforms

**Vercel**
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Railway / Render / Other**
- Ensure Node.js 18+ is available
- Set all environment variables
- Run `npm run build` and `npm start`

## Project Structure

```
.
├── app/                    # Next.js 16 App Router pages
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── organizations/ # Organization management
│   │   ├── projects/     # Project management
│   │   ├── tasks/        # Task management
│   │   ├── members/      # Member management
│   │   └── ai/           # AI task assignment
│   ├── admin/            # Admin dashboard
│   ├── lead/             # Lead dashboard
│   ├── member/           # Member dashboard
│   └── login/            # Authentication pages
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── models/           # MongoDB Mongoose models
│   ├── middleware/       # Authentication middleware
│   ├── db/               # Database connection
│   └── utils/            # Utility functions
├── hooks/                 # Custom React hooks
├── styles/                # Global styles
└── public/                # Static assets
```

## Usage

### First Time Setup

1. **Sign Up**: Create an account at `/login`
2. **Create Organization**: After signup, create your first organization
3. **Invite Members**: Add team members using the invite system
4. **Create Projects**: Start creating projects and assign leads
5. **Manage Tasks**: Create and assign tasks to team members

### User Roles

**Admin**
- Full access to all features
- Create and manage organizations
- Assign roles to members
- Create projects and tasks
- Use AI task assignment

**Lead**
- Manage assigned projects
- Create and assign tasks within projects
- View team member skills
- Use AI task assignment for their projects
- Close completed projects

**Member**
- View assigned tasks
- Update task status
- Manage personal skills
- View project information

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout user

### Organizations
- `GET /api/organizations/my-organizations` - Get user's organizations
- `POST /api/organizations/create` - Create new organization
- `POST /api/organizations/join` - Request to join organization
- `POST /api/organizations/switch` - Switch active organization

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/lead/route` - Get projects where user is lead
- `PUT /api/projects/[id]` - Update project
- `POST /api/projects/[id]/close` - Close completed project

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]/status` - Update task status
- `POST /api/tasks/[id]/reassign` - Reassign task to different member

### AI Features
- `POST /api/ai/generate-task` - Generate task using AI (Admin)
- `POST /api/ai/generate-task-for-member` - Generate task for specific member (Lead)

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Environment Validation**: Automatic validation prevents insecure deployment
- **Role-Based Access**: Endpoint protection based on user roles
- **Input Validation**: Comprehensive input validation on all endpoints
- **HTTPS Ready**: Secure by default in production

## Troubleshooting

### MongoDB Connection Error
- Verify MongoDB is running: `mongosh`
- Check connection string in `.env.local`
- For Atlas: Verify IP whitelist and credentials

### JWT Token Errors
- Ensure JWT_SECRET is set and is at least 32 characters
- Clear browser localStorage and login again
- Verify environment variables are loaded

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Check TypeScript errors: All should be resolved

### AI Features Not Working
- Verify GEMINI_API_KEY is set correctly
- Check API key is valid at https://makersuite.google.com/app/apikey
- Review API quota limits

## Development

### Run Development Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Lint Code
```bash
pnpm lint
```

### Start Production Server
```bash
pnpm start
```

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/work-management` |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) | Generated with crypto |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | Your API key |
| `JWT_EXPIRES_IN` | No | JWT token expiration | `7d` (default) |
| `NODE_ENV` | No | Node environment | `development` or `production` |
| `NEXT_PUBLIC_API_URL` | No | Public API URL | `http://localhost:3000` |

## License

This project is private and proprietary.

## Support

For issues and questions, please create an issue in the repository.
=======
# Talentronaut-Workspace
This is Workspace for Talentronaut.
>>>>>>> d950351 (Initial commit)
