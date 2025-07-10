# NubiluXchange - Gaming Account Marketplace

## Overview

NubiluXchange is a modern gaming marketplace application untuk jual-beli akun gaming. Platform ini telah dimigrasikan dari Node.js ke Laravel/PHP untuk kemudahan development dengan XAMPP dan phpMyAdmin, sambil mempertahankan frontend React yang mobile-first dengan desain terinspirasi TikTok.

## User Preferences

- Preferred communication style: Simple, everyday language (Bahasa Indonesia)
- Development environment: PHP/Laravel dengan XAMPP
- Database management: phpMyAdmin untuk GUI database
- Familiar with PHP syntax dan Laravel ecosystem

## System Architecture

### Frontend Architecture (Tetap React)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system (dark theme + green accent #134D37)
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Mobile-first**: WhatsApp-style status, TikTok-style video feed

### Backend Architecture (Migrated to Laravel)
- **Framework**: Laravel 10+ with PHP 8.2
- **Database**: MySQL dengan XAMPP
- **Database GUI**: phpMyAdmin untuk management
- **Authentication**: Laravel Sanctum (API tokens)
- **ORM**: Eloquent ORM (familiar PHP patterns)
- **API**: RESTful API endpoints
- **AI Integration**: OpenAI API untuk poster generation dan admin chat

### Migration Status (January 2025)
- **Database**: ✅ Successfully migrated to SQLite (untuk development) dengan rencana MySQL untuk production
- **Backend**: ✅ Laravel 12 backend dengan API lengkap telah dibuat
- **Models**: ✅ User, Product, Chat, Message, Transaction, StatusUpdate models
- **Controllers**: ✅ AuthController, ProductController dengan full CRUD operations
- **Authentication**: ✅ Laravel Sanctum untuk API token authentication
- **Database Migration**: ✅ Semua table berhasil dibuat dengan relationships
- **Sample Data**: ✅ Seeder dengan data contoh akun gaming sudah ready

## Key Components

### Core Features (Migrated to Laravel)
1. **Gaming Account Marketplace**: Laravel models untuk Product management
2. **WhatsApp-style Chat**: Eloquent relationships untuk Chat & Messages
3. **TikTok-style Video**: Video feed dengan like/comment overlays  
4. **Digital Wallet**: Laravel transactions dengan IDR currency
5. **Status Updates**: WhatsApp-style 24-hour stories
6. **AI-Powered Features**: OpenAI integration untuk poster generation

### Database Schema (MySQL dengan Laravel Migrations)
- **Users**: Laravel User model dengan role (buyer/seller), wallet balance
- **Products**: Gaming account listings dengan game_data JSON, categories
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

## Recent Migration Progress (January 2025)

### ✅ Completed
1. **Laravel Backend Setup**: Laravel 12 dengan SQLite database
2. **Database Structure**: Semua table untuk users, products, chats, messages, transactions, status updates
3. **API Endpoints**: RESTful API dengan authentication (register, login, products CRUD)
4. **Models & Relationships**: Eloquent models dengan proper relationships
5. **Sample Data**: Seeder dengan data contoh akun Mobile Legends dan PUBG
6. **Frontend Ready**: queryClient.ts sudah diupdate untuk Laravel API endpoints

### 🔄 Next Steps untuk Full Migration  
1. **Server Deployment**: Setup Laravel server dengan proper port configuration
2. **Frontend Integration**: Update semua API calls dari Node.js ke Laravel endpoints
3. **XAMPP Setup**: Migrasi database dari SQLite ke MySQL untuk production
4. **Real-time Features**: Implement WebSocket atau Pusher untuk chat real-time
5. **File Upload**: Setup Laravel storage untuk gambar produk dan profile