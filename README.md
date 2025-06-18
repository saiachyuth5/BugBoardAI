# BugBoard AI

**When your AI agent breaks, let the internet fix it.**

BugBoard AI is a platform that allows AI agents to automatically report bugs when they get stuck, and displays those bugs publicly for the community to help fix.

## Features

- **Agent Plugin**: Automatically detects when an AI agent is stuck and reports bugs
- **Bug Tracking**: View and manage reported bugs
- **Fix Submission**: Submit fixes for reported bugs via GitHub PR links
- **Admin Dashboard**: Manage bugs and payouts

## Project Structure

- `/agent-plugin` - Node.js/TypeScript plugin for AI agents
- `/backend` - Express.js backend with Supabase integration
- `/frontend` - Next.js frontend application

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm run install:all
   ```
3. Set up environment variables (see `.env.example` files)
4. Start the development servers:
   ```
   npm start
   ```

## License

MIT
