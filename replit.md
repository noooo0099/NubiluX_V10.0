# NubiluXchange - Gaming Account Marketplace

## Overview

NubiluXchange is a modern gaming marketplace application built with React and Express, designed specifically for trading gaming accounts and in-game items. The platform features a TikTok-inspired mobile-first design with real-time chat, video content, and secure transactions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket integration for live chat

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Session-based authentication
- **Real-time**: WebSocket server for chat functionality
- **AI Integration**: OpenAI API for poster generation and admin chat processing

### Mobile-First Design
- **Responsive**: Mobile-optimized with bottom navigation
- **Progressive Web App**: Configured for mobile installation
- **Dark Theme**: Gaming-focused dark color scheme
- **Touch-Friendly**: Optimized for mobile interactions

## Key Components

### Core Features
1. **Gaming Account Marketplace**: Buy/sell gaming accounts with detailed listings
2. **Real-time Chat**: WebSocket-powered messaging between buyers and sellers
3. **Video Content**: TikTok-style video feed for promotional content
4. **Digital Wallet**: In-app currency system for secure transactions
5. **AI-Powered Features**: Automated poster generation and admin assistance

### Database Schema
- **Users**: Authentication, profiles, wallet balances, verification status
- **Products**: Gaming account listings with metadata and pricing
- **Chats**: Real-time messaging between users
- **Messages**: Chat history with support for different message types
- **Transactions**: Purchase history and payment tracking
- **Notifications**: System alerts and user communications

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