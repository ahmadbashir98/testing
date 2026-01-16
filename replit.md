# CloudFire - Cloud Mining Platform

## Overview

CloudFire is a cloud cryptocurrency mining platform that allows users to rent virtual mining machines and earn profits. The application features user authentication, a dashboard displaying mining stats and assets, a machine rental marketplace, and a payment/withdrawal system. Built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with dark mode enabled by default
- **Form Handling**: React Hook Form with Zod validation
- **Design Theme**: Dark crypto-fintech aesthetic with navy blue backgrounds, blue/gold accent colors

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with tsx for development
- **API Pattern**: RESTful JSON API under `/api/*` routes
- **Build System**: esbuild for server bundling, Vite for client bundling

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Users**: Authentication, balance tracking, miner counts
- **Mining Machines**: Tiered machines (M1-M10) with different prices and daily profits
- **User Machines**: Tracks owned machines per user
- **Mining Sessions**: 24-hour mining cycles with claim rewards
- **Withdrawal Requests**: Payment requests with account numbers

### Authentication
- Simple username/password authentication (stored in plain text - development only)
- Client-side session persistence via localStorage
- Auth context provider wrapping the application

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── lib/          # Utilities, auth, query client
│       └── hooks/        # Custom React hooks
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code
│   └── schema.ts     # Drizzle schema + Zod validators
└── migrations/       # Database migrations
```

### Path Aliases
- `@/*` → `./client/src/*`
- `@shared/*` → `./shared/*`
- `@assets/*` → `./attached_assets/*`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **pg**: Node.js PostgreSQL client
- **connect-pg-simple**: Session store (available but sessions use localStorage currently)

### UI/Component Libraries
- **Radix UI**: Full suite of accessible, unstyled primitives
- **shadcn/ui**: Pre-styled component variants using Radix
- **Lucide React**: Icon library
- **embla-carousel-react**: Carousel component
- **vaul**: Drawer component
- **react-day-picker**: Calendar component
- **recharts**: Charting library
- **cmdk**: Command palette component

### Form/Validation
- **Zod**: Schema validation
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Zod resolver for React Hook Form
- **drizzle-zod**: Generate Zod schemas from Drizzle tables

### Build/Development Tools
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundler for production
- **tsx**: TypeScript execution for development
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS/Autoprefixer**: CSS processing

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay
- **@replit/vite-plugin-cartographer**: Development tools
- **@replit/vite-plugin-dev-banner**: Development banner