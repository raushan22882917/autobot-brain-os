# Autobot Brain OS

A modern, AI-powered decision-making platform built with React, Node.js, and TypeScript.

## 🚀 Features

- **AI-Powered Decision Making**: Leverage Google's Gemini AI for intelligent decision support
- **Modern UI**: Built with React, TailwindCSS, and Radix UI components
- **Authentication**: Secure user authentication with Clerk
- **Payment Integration**: Razorpay integration for subscription-based features
- **Project Management**: Jira integration for seamless workflow management
- **Real-time Collaboration**: Multi-user support with real-time updates

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **Wouter** - Lightweight routing
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Primary database
- **Clerk** - Authentication & user management

### Integrations
- **Google Gemini AI** - AI decision support
- **Razorpay** - Payment processing
- **Jira** - Project management
- **Slack** - Team notifications

## 📦 Project Structure

```
autobot-brain-os/
├── artifacts/
│   ├── api-server/          # Backend API server
│   ├── decision-brain/      # Frontend React app
│   └── mockup-sandbox/      # Development sandbox
├── lib/                     # Shared libraries
│   ├── api-client-react/    # React API client
│   ├── api-spec/           # API specifications
│   ├── api-zod/            # Zod schemas
│   ├── db/                 # Database schemas and migrations
│   └── integrations/       # External integrations
├── scripts/                # Build and utility scripts
└── attached_assets/        # Static assets
```

## 🚀 Deployment

### Vercel Deployment

This project is optimized for Vercel deployment:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Configure the required environment variables in Vercel dashboard
3. **Deploy**: Vercel will automatically build and deploy your application

### Environment Variables

Copy `.env.production.example` to `.env.production.local` for local development, or configure these in your Vercel dashboard:

#### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_PUBLISHABLE_KEY` - Clerk authentication public key
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `SESSION_SECRET` - Secure session secret
- `AI_INTEGRATIONS_GEMINI_API_KEY` - Google Gemini AI API key

#### Optional Variables
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google OAuth
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Razorpay payments
- `JIRA_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` - Jira integration
- `SLACK_WEBHOOK_URL` - Slack notifications

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- pnpm 8+

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development servers**:
   ```bash
   pnpm dev
   ```

   This will start both the frontend and backend servers concurrently.

### Build for Production

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

## 📚 Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm typecheck` - Run TypeScript type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the environment variables reference in `.env.production.example`

---

Built with ❤️ for modern decision-making
