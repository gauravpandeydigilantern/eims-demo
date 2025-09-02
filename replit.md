# EIMS - Edge Infrastructure Management System

## Overview

EIMS (Edge Infrastructure Management System) is a comprehensive monitoring and management platform for 5,000+ RFID devices across 800+ toll plazas in India's logistics network. The system provides real-time monitoring, remote device control, geographic visualization, and AI-powered analytics for managing Fixed Readers (FR) and Handheld Devices (HHD) across multiple vendors including BCIL, ZEBRA, IMP, and ANJ.

The application is built as a modern full-stack web application with a React frontend, Express.js backend, PostgreSQL database with Drizzle ORM, and real-time WebSocket communication for live device status updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Tailwind CSS** with shadcn/ui components for styling
- **Wouter** for client-side routing
- **TanStack Query** for server state management and caching
- **WebSocket** integration for real-time device status updates
- **Leaflet** for interactive geographic mapping of device locations

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with role-based access control
- **WebSocket server** for real-time data streaming
- **Service layer architecture** with dedicated services for devices, alerts, AI, and weather
- **Session-based authentication** with Replit Auth integration
- **Middleware** for request logging, error handling, and authorization

### Database Design
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Schema includes**:
  - Users table with role-based permissions (NEC_GENERAL, NEC_ENGINEER, NEC_ADMIN, CLIENT)
  - Devices table with status tracking and geographic information
  - Device metrics for historical performance data
  - Alerts system for notifications and warnings
  - Weather data integration for environmental monitoring
  - AI chat sessions for conversational interface
  - Device operations logging for audit trails

### Authentication & Authorization
- **Role-based access control** with four user types:
  - NEC_GENERAL: Complete system access
  - NEC_ENGINEER: Regional access restrictions
  - NEC_ADMIN: Device management capabilities
  - CLIENT: Read-only dashboard access
- **Geographic restrictions** for engineers based on assigned regions
- **Session management** with PostgreSQL storage
- **Replit Auth** integration for user authentication

### Real-time Features
- **WebSocket connections** for live device status updates
- **30-second refresh intervals** for device health monitoring
- **Real-time alerts** for device failures and weather conditions
- **Live dashboard updates** without page refresh

### AI Integration
- **OpenAI GPT-5** integration for conversational AI assistance
- **Natural language queries** for device status and analytics
- **Intelligent troubleshooting** recommendations
- **Vector database** for semantic search capabilities

## External Dependencies

### Cloud Services
- **Neon Database** for PostgreSQL hosting (@neondatabase/serverless)
- **OpenAI API** for AI-powered features and chat assistance
- **Weather API** integration for environmental monitoring

### UI Components & Styling
- **Radix UI** primitives for accessible component foundation
- **Tailwind CSS** for utility-first styling approach
- **shadcn/ui** component library for consistent design system
- **Leaflet** for interactive mapping and geographic visualization

### Development Tools
- **Vite** for fast development and optimized production builds
- **TypeScript** for type safety across frontend and backend
- **Drizzle Kit** for database migrations and schema management
- **ESBuild** for backend bundling in production

### Device Integration
- **Vendor APIs** for BCIL, ZEBRA, IMP, and ANJ device management
- **SSH/SNMP protocols** for Linux-based Fixed Reader control
- **Android APK interfaces** for Handheld Device management
- **Multi-vendor command abstraction** layer for unified device operations

### Infrastructure
- **WebSocket support** for real-time communication
- **Session storage** with connect-pg-simple
- **CORS handling** for cross-origin requests
- **Express middleware** for logging, authentication, and error handling