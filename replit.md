# NubiluXchange - Gaming Account Marketplace

## Overview

NubiluXchange is a modern gaming marketplace application untuk jual-beli akun gaming. Platform ini diimplementasikan menggunakan TypeScript full-stack dengan Neon PostgreSQL untuk performance dan type safety, dengan frontend React yang mobile-first dan desain terinspirasi TikTok.

## User Preferences

- Preferred communication style: Simple, everyday language (Bahasa Indonesia)
- Development environment: TypeScript full-stack dengan Neon PostgreSQL
- Database management: Drizzle ORM untuk type-safe operations
- Modern TypeScript development dengan React dan Express.js

## System Architecture

### Frontend Architecture (Tetap React)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system (dark theme + green accent #134D37)
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Mobile-first**: WhatsApp-style status, TikTok-style video feed

### Backend Architecture (TypeScript + Express.js)
- **Framework**: Express.js dengan TypeScript
- **Database**: Neon PostgreSQL (serverless)
- **Database ORM**: Drizzle ORM dengan type safety
- **Authentication**: JWT dengan bcrypt hashing
- **Sessions**: PostgreSQL-backed session store
- **API**: RESTful API endpoints
- **AI Integration**: OpenAI API untuk poster generation dan admin chat

### Implementation Status (September 2025)
- **Database**: ✅ Neon PostgreSQL dengan Drizzle ORM type-safe operations
- **Backend**: ✅ Express.js TypeScript backend dengan API lengkap
- **Models**: ✅ User, Product, Chat, Message, Transaction, StatusUpdate models
- **Controllers**: ✅ RESTful API routes dengan full CRUD operations
- **Authentication**: ✅ JWT authentication dengan bcrypt password hashing
- **Database Schema**: ✅ Semua table berhasil dibuat dengan relationships
- **Session Store**: ✅ PostgreSQL-backed session management

## Key Components

### Core Features (TypeScript Implementation)
1. **Gaming Account Marketplace**: Drizzle ORM models untuk Product management
2. **WhatsApp-style Chat**: Type-safe relationships untuk Chat & Messages
3. **TikTok-style Video**: Video feed dengan like/comment overlays  
4. **Digital Wallet**: TypeScript transactions dengan IDR currency
5. **Status Updates**: WhatsApp-style 24-hour stories
6. **AI-Powered Features**: OpenAI integration untuk poster generation

### Database Schema (PostgreSQL dengan Drizzle ORM)
- **Users**: TypeScript User model dengan role (buyer/seller), wallet balance
- **Products**: Gaming account listings dengan game_data JSONB, categories
- **Chats**: WhatsApp-style chat rooms antara buyer-seller
- **Messages**: Chat messages dengan message_type (text/image/ai_admin)
- **Transactions**: Wallet transactions (deposit/withdraw/purchase)
- **Status Updates**: 24-hour expiring status dengan image support

### UI Components
- **Layout**: Top navigation, bottom navigation, and floating action buttons
- **Cards**: Product listings, chat interfaces, and user profiles
- **Forms**: Account creation, product uploads, and settings
- **Modals**: Notifications, confirmations, and detailed views

## Data Flow

### User Authentication
1. Users register/login through the authentication system
2. Session management handles user state across the application
3. Protected routes ensure secure access to user-specific features

### Product Lifecycle
1. Sellers upload gaming accounts through the upload interface
2. Products are stored with metadata, images, and pricing information
3. Buyers browse products through category filters and search
4. Chat system enables communication between buyers and sellers
5. Transactions are processed through the digital wallet system

### Real-time Communication
1. WebSocket connections established on user login
2. Chat messages broadcast to relevant participants
3. Online status and typing indicators for enhanced UX
4. AI admin mentions for automated customer support

## External Dependencies

### Database & Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **connect-pg-simple**: PostgreSQL session store

### AI & Media Processing
- **OpenAI API**: Poster generation and chat processing
- **Image hosting**: External image storage for product media

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Consistent icon library

### Real-time Features
- **WebSocket (ws)**: Real-time communication
- **TanStack Query**: Server state management and caching

## Deployment Strategy

### Development Environment
- **Vite**: Fast development server with HMR
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast production builds
- **Replit Integration**: Cloud development environment

### Production Considerations
- **Environment Variables**: Database URL, OpenAI API key, session secrets
- **Static Assets**: Vite build output served by Express
- **Database Migrations**: Drizzle Kit for schema management
- **Session Storage**: PostgreSQL-backed session store

### Scalability Features
- **Serverless Database**: Neon Database for automatic scaling
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Drizzle ORM with efficient query patterns
- **Caching**: TanStack Query for client-side caching

The application is designed for the Indonesian gaming market with support for local currency (IDR) and gaming-specific features like skin collections, rank boosting services, and account verification systems.

## Development Progress (September 2025)

### ✅ Completed
1. **TypeScript Full-Stack**: Express.js backend dengan React frontend
2. **Database Structure**: Neon PostgreSQL dengan Drizzle ORM type-safe operations
3. **API Endpoints**: RESTful API dengan JWT authentication (register, login, products CRUD)
4. **Models & Relationships**: TypeScript models dengan Drizzle relations
5. **Session Management**: PostgreSQL-backed session store dengan connect-pg-simple
6. **Type Safety**: End-to-end TypeScript dengan shared schema definitions

### ✅ Bug Fixes & Improvements Completed
1. **Database Connection**: Migrated to Neon PostgreSQL dengan connection pooling
2. **Type Safety**: Full TypeScript implementation dengan strict checking
3. **Server Configuration**: Single-port architecture pada port 5000
4. **Authentication**: JWT dengan bcrypt password hashing
5. **Development Experience**: Hot reload dengan Vite dan HMR

### 🎯 Next Phase (Ready for Development)
1. **Real-time Features**: Implement WebSocket untuk chat real-time
2. **File Upload**: Setup cloud storage untuk gambar produk dan profile  
3. **Payment Gateway**: Integrate payment system untuk transactions
4. **Production Deployment**: Configure untuk deployment ke Replit
5. **Advanced Features**: Search filters, admin dashboard, analytics