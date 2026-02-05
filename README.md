# ZAAD - Business Documents & Management Dashboard

A modern, full-featured admin dashboard built with Next.js for managing business documents, employees, companies, invoices, and transactions. Designed to streamline business operations with a comprehensive suite of management tools.

## 📋 Overview

ZAAD is an enterprise-level business management platform that provides organizations with centralized control over their operations. The system enables management of multiple companies, employee records, financial transactions, and critical business documents with advanced filtering, search, and reporting capabilities.

**Version:** 1.3.1

---

## 🎯 Key Features

### 👥 User Management
- Role-based access control (Partner, Employee)
- User authentication with JWT tokens
- Secure password management with bcryptjs
- User activity logging and audit trails
- User history tracking

### 🏢 Company Management
- Comprehensive company profile management
- License and emirate tracking
- Document management for companies
- Platform credentials storage
- Multi-emirate support
- Mainland/Freezone classification

### 👨‍💼 Employee Management
- Employee records with detailed information
- Employment status tracking
- Employee activity monitoring
- Bulk employee operations

### 💰 Financial Management
- Invoice creation and management
- Transaction tracking
- Multiple payment method support
- Self-deposit functionality
- Self-service payment modal
- Expense and income tracking
- Financial reporting with charts

### 📊 Analytics & Reporting
- Interactive charts and data visualization (ApexCharts)
- Last 12 months trends
- Last 7 days analytics
- Custom date range reporting
- Statistical dashboards
- Real-time data updates

### 📝 Advanced Features
- Document management and storage
- Search functionality across all records
- Confirmation modals for critical operations
- Print-to-PDF capabilities
- Dark mode support
- Real-time notifications (React Hot Toast)
- Responsive design with Tailwind CSS

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14.2.3
- **React:** 18.x
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4 + PostCSS
- **State Management:** React Query (TanStack Query 5.63)
- **Charts:** ApexCharts with React integration
- **Notifications:** React Hot Toast
- **Print:** React to Print

### Backend
- **Runtime:** Node.js
- **API:** Next.js API Routes
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcryptjs
- **Database:** MongoDB (Mongoose ODM)
- **Caching:** Redis
- **HTTP Client:** Axios

### Development Tools
- **Type Checking:** TypeScript
- **Code Quality:** ESLint
- **Code Formatting:** Prettier with Tailwind plugin
- **Package Manager:** PNPM

---

## 📁 Project Structure

```
zaad/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (logged)/            # Protected routes
│   │   │   ├── accounts/        # Account management
│   │   │   ├── company/         # Company management pages
│   │   │   ├── employee/        # Employee management pages
│   │   │   ├── settings/        # User settings
│   │   │   └── users/           # User management
│   │   ├── api/                 # API endpoints
│   │   │   ├── company/
│   │   │   ├── employee/
│   │   │   ├── invoice/
│   │   │   ├── payment/
│   │   │   ├── search/
│   │   │   └── users/
│   │   ├── login/               # Authentication page
│   │   ├── layout.tsx           # Root layout
│   │   └── middleware.ts        # Route protection
│   ├── components/              # Reusable React components
│   │   ├── Tables/              # Data tables
│   │   ├── Forms/               # Form components
│   │   ├── Charts/              # Chart components
│   │   ├── Modals/              # Modal dialogs
│   │   ├── Header/              # Navigation header
│   │   ├── Sidebar/             # Navigation sidebar
│   │   └── common/              # Common utilities
│   ├── models/                  # Mongoose schemas
│   │   ├── users.ts
│   │   ├── companies.ts
│   │   ├── employees.ts
│   │   ├── invoice.ts
│   │   ├── records.ts
│   │   └── userActivity.ts
│   ├── helpers/                 # Utility functions
│   │   ├── calculateLast12Months.ts
│   │   ├── getUserFromCookie.ts
│   │   ├── userActivityLogger.ts
│   │   └── processDocuments.ts
│   ├── hooks/                   # Custom React hooks
│   ├── contexts/                # React contexts
│   ├── providers/               # Provider components
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # General utilities
│   ├── db/                      # Database connections
│   ├── css/                     # Stylesheets
│   └── libs/                    # Shared libraries
├── public/                       # Static assets
└── Configuration files
    ├── next.config.mjs
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── postcss.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or higher
- PNPM package manager
- MongoDB instance (local or cloud)
- Redis instance (for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zaad
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/zaad
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key_here
   
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 📚 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build application for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint to check code quality |

---

## 🔐 Security Features

- **Authentication:** JWT-based token system with secure cookie storage
- **Authorization:** Role-based access control (RBAC)
- **Password Security:** bcryptjs encryption for password hashing
- **Route Protection:** Middleware-based route protection
- **Soft Deletes:** `deletedAt` timestamp for data integrity
- **Activity Logging:** Comprehensive user action logging

---

## 🎨 UI/UX Features

- **Responsive Design:** Mobile-first approach with Tailwind CSS
- **Dark Mode:** Built-in dark mode support
- **Interactive Charts:** Real-time data visualization
- **Loading States:** Skeleton loaders for better UX
- **Toast Notifications:** Non-intrusive alerts and confirmations
- **Print Support:** PDF export functionality for documents
- **Accessibility:** Semantic HTML and ARIA labels

---

## 📊 Data Models

### User Schema
- Username, Full Name, Password (hashed)
- Role (Partner/Employee)
- Status and soft delete support
- Timestamps (created, updated)

### Company Schema
- Name, License Number, Company Type
- Contact Information (phones, email)
- Location (Emirates, Mainland/Freezone)
- Document Management (with expiry tracking)
- Platform Credentials Storage
- Timestamps

### Employee Schema
- Personal information
- Employment details
- Activity tracking

### Invoice Schema
- Invoice details and line items
- Payment tracking
- Status management

### Records Schema
- Transaction records
- Document records
- Status and metadata

---

## 🔄 API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### Companies
- `GET /api/company` - List all companies
- `POST /api/company` - Create new company
- `GET /api/company/[id]` - Get company details
- `PUT /api/company/[id]` - Update company
- `DELETE /api/company/[id]` - Delete company

### Employees
- `GET /api/employee` - List all employees
- `POST /api/employee` - Create new employee
- `GET /api/employee/[id]` - Get employee details
- `PUT /api/employee/[id]` - Update employee

### Search
- `GET /api/search` - Global search across all records

### Additional modules include Invoice, Payment, and User management endpoints.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📝 License

This project is private and proprietary.

---

## 💼 Career Highlights

This project demonstrates proficiency in:

✅ **Full-Stack Development:** Complete end-to-end application development
✅ **Modern React Architecture:** Server components, hooks, context API, and state management
✅ **TypeScript:** Strict type safety and advanced TypeScript patterns
✅ **API Design:** RESTful API design with proper routing and middleware
✅ **Database Design:** Schema design with MongoDB and Mongoose
✅ **Authentication & Security:** JWT tokens, password hashing, role-based access
✅ **Performance Optimization:** React Query for efficient data fetching and caching
✅ **UI/UX Development:** Responsive design, dark mode, accessibility
✅ **Data Visualization:** Complex charts and analytics
✅ **DevOps & Deployment:** Production-ready build pipeline

---

## 📞 Contact & Support

For questions or support regarding this project, please contact the project owner.

---

**Last Updated:** February 2026
**Maintained By:** Development Team
