# Overview

This is a full-stack portfolio website for Bruna Barboza Sofia, built as a modern web application showcasing projects, achievements, and professional information. The application features a React-based frontend with a Node.js/Express backend, designed to present work in an interactive and engaging format with social features like comments and likes.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming, supporting both dark and light modes
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints with JSON responses
- **Real-time Communication**: WebSocket integration for live notifications
- **File Handling**: Multer middleware for image and video uploads with file type validation
- **Authentication**: JWT-based authentication with bcrypt for password hashing

## Database & ORM
- **Database**: PostgreSQL (configured for Neon Database serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Management**: Centralized schema definitions in `/shared/schema.ts`
- **Migration Strategy**: Drizzle Kit for database migrations and schema updates

## Authentication & Authorization
- **Strategy**: JWT tokens stored in localStorage
- **Password Security**: Bcrypt hashing with salt rounds
- **Role-based Access**: Admin role system for content management
- **Session Management**: Client-side auth state management with automatic cleanup

## File Storage & Media
- **Upload Strategy**: Local file system storage with organized directory structure
- **Supported Formats**: Images (JPEG, PNG, GIF) and videos (MP4, MOV, AVI, WebM)
- **Size Limits**: 50MB maximum file size with validation
- **Security**: File type validation and secure filename generation

## Development & Build
- **Build Tool**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement with error overlay
- **Production Build**: ESBuild for server bundling, Vite for client assets
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared code

# External Dependencies

## Core Framework Dependencies
- **Frontend**: React, React DOM, Vite, TypeScript
- **Backend**: Express.js, Node.js HTTP server
- **Database**: PostgreSQL via Neon Database serverless driver
- **ORM**: Drizzle ORM with PostgreSQL dialect

## UI & Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer
- **Icons**: Lucide React for consistent iconography
- **Utilities**: Class Variance Authority (CVA) for component variants

## State Management & Data Fetching
- **Server State**: TanStack React Query for caching and synchronization
- **Form Management**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for runtime type validation and schema definitions

## Authentication & Security
- **JWT Handling**: jsonwebtoken library for token operations
- **Password Hashing**: bcrypt for secure password storage
- **File Uploads**: Multer for multipart form handling

## Communication Services
- **Email Service**: SendGrid for transactional emails
- **Real-time**: WebSocket (ws library) for live updates
- **Social Sharing**: LinkedIn sharing API integration

## Development Tools
- **Build Optimization**: ESBuild for server bundling
- **Development Experience**: Replit-specific plugins for runtime errors and debugging
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## External APIs & Services
- **Email Provider**: SendGrid API for sending notifications and contact forms
- **Database Hosting**: Neon Database for serverless PostgreSQL
- **Social Media**: LinkedIn API for project sharing functionality
- **Font Services**: Google Fonts for typography (Inter, Source Serif Pro, Fira Code)