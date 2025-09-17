# Smart Cloud Dashboard

> **Empirical Study of Latency–Consistency Trade-offs on Free-Tier Serverless Platforms**

A production-grade web application that demonstrates the fundamental trade-offs between consistency and latency in distributed cloud systems. Built with Next.js, TypeScript, and Supabase.

![Phase](https://img.shields.io/badge/Phase-1%20Complete-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.0+-black)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Git

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd cc_project
npm install
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your credentials
3. Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local .env.local.example
```

4. Update your `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

5. Run the database migration in your Supabase SQL editor:

```bash
# Copy and paste the contents of migrations/001_initial_schema.sql
# into your Supabase SQL editor and execute
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### 4. Verify Setup

Check the health endpoint: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Should return:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "up", "responseTime": 45.23 },
    "api": { "status": "up", "responseTime": 12.34 }
  }
}
```

## 🏗️ Architecture

### Current Implementation (Phase 1)

```
├── src/app/
│   ├── page.tsx                 # Dashboard UI with error boundaries
│   └── api/
│       ├── always-fresh/        # Strong consistency endpoint
│       └── health/              # System health checks
├── src/components/ui/           # Production-grade React components
├── src/lib/
│   ├── supabase.ts             # Database client with connection pooling
│   ├── logger/                 # Structured logging system
│   └── types/                  # TypeScript schemas and validation
└── migrations/                 # Database schema and sample data
```

### Technology Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Zod validation, Winston logging
- **Database**: Supabase (PostgreSQL 15)
- **Validation**: Zod schemas with runtime type checking
- **Error Handling**: Custom error classes, React Error Boundaries
- **Logging**: Structured JSON logging with request correlation

## 📊 API Endpoints

### `GET /api/always-fresh`

Demonstrates **strong consistency** by fetching data directly from the master database.

**Query Parameters:**
- `limit` (optional): Number of products (1-100, default: 10)
- `offset` (optional): Pagination offset (default: 0)
- `category` (optional): Filter by product category

**Response Example:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Cloud Server Instance - Basic",
      "price": 29.99,
      "category": "compute",
      "updated_at": "2025-09-14T10:30:00Z"
    }
  ],
  "metadata": {
    "requestId": "req-123",
    "duration": 45.23,
    "timestamp": "2025-09-14T10:30:00Z",
    "count": 1
  }
}
```

### `GET /api/health`

System health check endpoint for monitoring and alerting.

## 🧪 Features

### ✅ Implemented (Phase 1)

- **Production-Grade Error Handling**: Custom error classes, typed exceptions, graceful degradation
- **Input Validation**: Zod schemas with comprehensive validation rules
- **Structured Logging**: Request correlation, performance timing, error tracking
- **Health Monitoring**: Database connectivity checks, response time monitoring
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Security**: Input sanitization, CORS headers, error message sanitization
- **Performance**: Connection pooling, timeout handling, request optimization
- **Type Safety**: End-to-end TypeScript with strict mode

### 🚧 Coming Next (Phase 2)

- **TTL Cache Model** (`/api/check-fast`): Demonstrates eventual consistency with time-based expiration
- **Edge LRU Model** (`/api/smart-memory`): Intelligent edge caching with LRU eviction
- **Visual Performance Metrics**: Real-time latency graphs and consistency indicators

### 📋 Roadmap (Phases 3-4)

- **Load Testing**: Automated geo-distributed benchmark harness using GitHub Actions
- **Data Export**: CSV export functionality for academic analysis
- **Research Paper**: 4-page ACM workshop paper with empirical findings

## 🔧 Development

### Code Quality Standards

This project maintains production-grade code quality:

- **ESLint + Prettier**: Automated code formatting and linting
- **TypeScript Strict Mode**: Full type safety with no `any` types
- **Error Boundaries**: Graceful error handling in React components
- **Input Validation**: Runtime validation with Zod schemas
- **Security**: OWASP compliance, no SQL injection vulnerabilities
- **Performance**: Optimized queries, connection pooling, caching headers

### Running Tests

```bash
# Lint check
npm run lint

# Type check
npm run type-check

# Build verification
npm run build
```

### Environment Variables

Required environment variables:

```env
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional Configuration
LOG_LEVEL=info                    # winston log level
DB_TIMEOUT_MS=5000               # database timeout
DB_MAX_RETRIES=3                 # retry attempts
NODE_ENV=development             # environment
```

## 📈 Monitoring

### Health Checks

- **Endpoint**: `/api/health`
- **Frequency**: Every 30 seconds (recommended)
- **Alerting**: Alert on `status !== "healthy"`

### Logging

All requests include structured logging with:
- Request ID correlation
- Performance timing
- Error details and stack traces
- User agent and IP tracking

Logs are JSON formatted for easy parsing and analysis.

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm run start
```

## 📚 Academic Context

This project serves as both a functional dashboard and a research tool for studying consistency-latency trade-offs in serverless architectures. It will generate empirical data for academic publication.

**Research Questions:**
1. How do response times distribute across consistency models?
2. What staleness probability emerges under write load?
3. Does geo-distance amplify the latency-consistency gap?

## 📄 License

Apache 2.0 License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is an academic project, but suggestions and improvements are welcome via issues.

---

**Built with ❤️ for the Academic Community**
