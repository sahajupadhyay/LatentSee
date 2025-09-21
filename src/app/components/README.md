# Components Directory Structure

This directory contains all React components organized by functionality and purpose.

## Directory Structure

```
src/app/components/
├── auth/           # Authentication related components (Phase 3.5)
├── analytics/      # Analytics dashboard components (Phase 3)
├── charts/         # Chart components using Recharts (Phase 3)
├── dashboard/      # Main dashboard components (Phase 2 ✅)
├── ecommerce/      # E-commerce simulation components (Phase 4)
├── forms/          # Reusable form components (Phase 3.5+)
├── layout/         # Layout components (navbar, footer, etc.)
└── ui/             # Base UI components (Phase 1 ✅)
```

## Component Categories

### 📁 `auth/` - Authentication Components
Components for user authentication and authorization:
- `LoginForm` - Login form with Supabase auth
- `SignupForm` - User registration form
- `AuthProvider` - React context for auth state
- `ProtectedRoute` - Route protection wrapper

### 📁 `analytics/` - Analytics Dashboard
Advanced analytics and metrics components:
- `RealTimeMetrics` - Live performance metrics
- `RequestHistoryViewer` - Historical request data
- `CacheEfficiencyChart` - Cache performance visualization
- `InteractiveTTLControls` - TTL adjustment controls

### 📁 `charts/` - Chart Components
Reusable chart components using Recharts:
- `LineChart` - Time series data visualization
- `BarChart` - Categorical data comparison
- `DonutChart` - Percentage/ratio visualization
- `MetricsChart` - Performance metrics charts

### 📁 `dashboard/` - Dashboard Components
Core dashboard functionality:
- `ConsistencyModelCard` - Model selection cards
- `MetricsPanel` - Performance metrics display
- `ProductGrid` - Product data visualization
- `DashboardHeader` - Dashboard navigation

### 📁 `ecommerce/` - E-Commerce Components
Shopping simulation components:
- `ProductCatalog` - Product listing and search
- `ProductSearch` - Search functionality
- `ShoppingCart` - Cart management
- `ProductCard` - Individual product display
- `AnomalyHighlighter` - Cache inconsistency visualization

### 📁 `forms/` - Form Components
Reusable form elements:
- `Input` - Styled input component
- `Button` - Consistent button styling
- `Select` - Dropdown selection
- `Toggle` - Toggle switches
- `FormField` - Form field wrapper with validation

### 📁 `layout/` - Layout Components
Page structure and navigation:
- `Navbar` - Top navigation with auth state
- `Footer` - Site footer
- `Sidebar` - Side navigation (if needed)
- `MainLayout` - Main page wrapper

### 📁 `ui/` - Base UI Components ✅
Foundation UI components (already implemented):
- `ErrorBoundary` - Error handling wrapper
- Additional base components as needed

## Import Conventions

Each directory has an `index.ts` file for clean imports:

```typescript
// Instead of:
import { LoginForm } from './auth/LoginForm';
import { SignupForm } from './auth/SignupForm';

// Use:
import { LoginForm, SignupForm } from '@/app/components/auth';
```

## Development Guidelines

1. **Component Naming**: Use PascalCase for component names
2. **File Structure**: Each component should have its own file
3. **Props Interface**: Define TypeScript interfaces for all props
4. **Styling**: Use Tailwind CSS classes consistently
5. **Animations**: Use Framer Motion for interactions
6. **Accessibility**: Include ARIA labels and keyboard navigation
7. **Error Handling**: Wrap components in ErrorBoundary when needed

## Phase Implementation Status

- ✅ **Phase 1-2**: `ui/` components implemented
- 🚧 **Phase 3**: `analytics/` and `charts/` components pending
- 🚧 **Phase 3.5**: `auth/` and enhanced `layout/` components pending
- 🚧 **Phase 4**: `ecommerce/` components pending
- 🚧 **Phase 5**: Polish and enhancement of all components

## Next Steps

1. Implement analytics dashboard components (Phase 3)
2. Build authentication components (Phase 3.5)
3. Create e-commerce simulation components (Phase 4)
4. Polish and enhance all components (Phase 5)