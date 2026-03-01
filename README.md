# Esquire Backoffice

Administrative Backoffice GUI for the Esquire Frameworks™ 2.0 ecosystem.

Esquire Backoffice provides a production-grade operational interface for managing
business entities, users, permissions, onboarding workflows, and account activity
over the Esquire microservices platform.

The application is built as a modern React single-page application with a Node.js
proxy layer for secure API access, routing, and integration with identity providers.

---

## Overview

Esquire Backoffice is intended for administrators, operators, and support teams
responsible for maintaining organizational structures and operational processes.

It integrates with Esquire backend services via REST APIs and uses Keycloak for
authentication and authorization.

Key use cases include:

- Organizational entity management
- User onboarding and lifecycle management
- Access control and permissions
- Account monitoring and operations
- Administrative workflows
- Operational support tooling

---

## Architecture

The system follows a layered architecture:

Browser (React SPA)
        ↓
Node.js Proxy / API Gateway
        ↓
Esquire Services (REST APIs)
        ↓
Data Layer & Messaging Infrastructure

### Frontend

- React (SPA)
- TypeScript (recommended)
- Component-based architecture
- Permission-aware UI rendering
- Secure token handling

### Proxy Layer

- Node.js backend
- Acts as BFF (Backend-for-Frontend)
- Handles authentication flows
- Protects backend endpoints
- Performs request routing and aggregation
- Applies security policies
- Enables environment-specific configuration

---

## Key Features

- Entity tree navigation and maintenance
- User profile management
- Role-based access control (RBAC)
- Permission-aware UI actions
- Administrative dashboards (planned)
- Account and activity views
- Secure authentication via Keycloak (OIDC)
- Audit-friendly operational workflows
- Scalable microservices integration

---

## Security

Security is a primary design goal.

- OIDC authentication via Keycloak
- Authorization Code flow (recommended)
- Token handling via proxy layer
- Protection of backend endpoints
- Permission-based UI controls
- Separation of concerns between UI and services

---

## Integration with Esquire Frameworks

This project is part of the broader Esquire Frameworks 2.0 ecosystem.

Related repositories:

- esquire.services — backend microservices
- esquire.explorer — primary user-facing client
- esquire.db.seed — reference data and initialization

---

## Technology Stack

Frontend:

- React
- TypeScript (optional but recommended)
- Modern CSS / UI framework (project-specific)

Backend / Proxy:

- Node.js
- Express (or compatible framework)
- REST API integration

Infrastructure:

- Docker (recommended)
- Keycloak IAM
- PostgreSQL-backed services

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Running Esquire backend services
- Keycloak instance configured
- Docker (optional but recommended)

---

### 1. Clone Repository

```bash
git clone https://github.com/aegisaosoft/esquire.backoffice.git
cd esquire.backoffice
