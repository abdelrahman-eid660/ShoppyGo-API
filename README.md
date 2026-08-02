# 🛒 ShoppyGo - Enterprise Hybrid E-Commerce & ERP Backend Platform

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white)

An advanced, highly scalable, hybrid **REST & GraphQL** backend platform combining **E-Commerce** capabilities with a full-fledged **Enterprise Resource Planning (ERP)** engine. Engineered with **NestJS**, **Redis Caching**, **Socket.io Realtime Gateways**, **Firebase Push Notifications**, and an **Event-Driven Architecture**.

---
## 📮 API Documentation & Postman Collections

Explore, test, and integrate the API routes directly using the official Postman links below (Includes pre-configured active environments, auth tokens, and payload examples):

* 🚀 **[ShoppyGo Postman Interactive Workspace](https://abdelrahman-eid660-4439622.postman.co/workspace/Abdelrahman-Eid's-Workspace~9ce35d28-4927-40cd-8447-99cca6ad1322/request/48416887-5d2df56c-6d9a-4372-8510-1e63dc12ad77?action=share&creator=48416887&active-environment=48416887-55c4017d-db2e-41ac-b304-9039e168b6b3)**

* 📦 **[ShoppyGo Complete API Collection & Environment](https://abdelrahman-eid660-4439622.postman.co/workspace/Abdelrahman-Eid's-Workspace~9ce35d28-4927-40cd-8447-99cca6ad1322/collection/6a3787ee2811042a126c6753?action=share&creator=48416887&active-environment=48416887-55c4017d-db2e-41ac-b304-9039e168b6b3)**
## 🌟 Architectural & Technical Highlights

### ⚡ 1. Hybrid REST + GraphQL Engine
* **GraphQL for Heavy GET Endpoints**: Utilized GraphQL query resolvers on read-heavy domain entities (Products, Catalogs, Inventory Views) to completely eliminate over-fetching/under-fetching and reduce client-side payload sizes.
* **REST APIs for Mutation Workflows**: Preserved RESTful conventions for core state-changing operations and webhooks.

### 📡 2. Real-time Communication & Notifications
* **Socket.io Gateways**: Dedicated WebSocket gateways delivering instant, low-latency updates for in-app `notifications` and critical `stockAlert` events across physical warehouses.
* **Firebase Cloud Messaging (FCM)**: Multi-channel push notification engine integrated for user mobile/web alerts.
* **Event-Driven Architecture (`EventEmitter` / Listeners)**: Completely decoupled side-effects (e.g., inventory deduction automatically fires stock-alert events and notification listeners asynchronously).

### 🚀 3. High-Performance Caching Layer
* **Redis In-Memory Cache**: Strategic caching implementation over heavy read routes, catalog lookups, and session tokens to maintain sub-millisecond response times under peak traffic.

### 🛡️ 4. Advanced Security, Authorization & Validation
* **Granular RBAC & Fine-Grained Permissions**: Custom Auth/Authorization Guards coupled with custom Decorators (`@Permissions()`, `@CurrentUser()`, `@Public()`) for precise role and permission enforcement across system endpoints.
* **Strict Validation Pipeline**: Combined NestJS `ValidationPipe` with `class-validator` and `class-transformer` alongside specialized **Custom Decorators** for deep payload integrity checks.
* **Rate-Limiting (Anti-DDoS)**: Per-route throttled limits using `@nestjs/throttler` (protecting Auth, Payment, and Upload endpoints).
* **Direct-to-S3 Media Uploads**: Secure AWS S3 Pre-Signed Upload & Fetch Link generation to bypass application server bandwidth bottlenecks.

---

## 🚀 Core Features & Modules Overview

### 🔐 1. Authentication, Authorization & Permissions
* **Auth Core**: Local Auth, Google OAuth (Login with Gmail), Password Reset, and Email Verification.
* **Security Pipeline**: Authentication Guards, Permission Guards, and Custom User Decorators.

### ⚡ 2. Real-Time & Notification System
* **Realtime Socket Gateway**: Push live `stockAlert` triggers to inventory managers and instant in-app `notifications` to customers.
* **Firebase Integration**: Multi-channel FCM push notifications.
* **Event Listeners**: Internal event dispatching for decoupled system actions.

### 🛍️ 3. Product Catalog & GraphQL Resolvers
* **Products & Variants**: Complex SKU management via GraphQL Queries & REST endpoints.
* **Categories & Brands**: Deeply nested category trees with Redis caching.
* **Suppliers & Coupons**: Brand suppliers, product suppliers, and promotional engines.

### 📦 4. ERP, Warehouse & Multi-Inventory Engine
* **Inventories & Warehouses**: Real-time stock level monitoring across physical fulfillment centers.
* **Stock Adjustments & Alerts**: Automated low-stock thresholds driving real-time WebSocket alerts.
* **Warehouse Transformation**: Inter-warehouse stock transfers and inventory movements with immutable Audit Logs.

### 💳 5. Sales, Orders & Payments
* **Transactional Cart & Checkout**: MongoDB ACID-compliant transaction sessions (`session.startTransaction()`) guaranteeing stock consistency.
* **Payments & Shipping**: Webhook listeners and regional shipping rules.

### 📊 6. Analytics, Financials & Audit Logs
* **Audit Trail**: System-wide administrative tracking for high-security actions.
* **Financial Review**: Sales performance, revenue metrics, and warehouse movement analytics.

---

## 🛠️ Tech Stack & Libraries

* **Core Framework**: [NestJS](https://nestjs.com/) (Node.js) & [TypeScript](https://www.typescriptlang.org/)
* **API Paradigm**: Hybrid **REST** & **GraphQL** (`@nestjs/graphql`, `apollo-server-fastify` / `express`)
* **Real-time & Messaging**: **Socket.io** (`@nestjs/websockets`), **Firebase Admin SDK** (FCM)
* **Databases**: **MongoDB** (Mongoose ODM) & **Redis** (Caching & Session Store)
* **Event System**: `@nestjs/event-emitter`
* **Validation & Utilities**: `class-validator`, `class-transformer`, Custom NestJS Decorators & Guards
* **Cloud Storage**: **AWS S3** (`@aws-sdk/client-s3`, Pre-Signed URLs)
* **Security**: `@nestjs/throttler`, `helmet`, `bcrypt`, `jsonwebtoken`

---

## 🛡️ Security & Rate Limiting Strategy

| Endpoint Domain | Protocol | Protection / Strategy |
| :--- | :--- | :--- |
| **Auth & Security** | REST | `5 - 10 req / min` + Custom Auth/Permission Guards |
| **Catalog & Products** | GraphQL / REST | Redis Cache Enabled + `250 req / min` |
| **Media Pre-Signed Upload** | REST | `15 req / min` + Auth Guard |
| **Webhooks (Payments)** | REST | `@SkipThrottle()` + Signature Verification |
| **Realtime WebSockets** | WS / Socket.io | JWT Handshake Authentication & Room-Based Authorization |

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```env
# Application Setup
PORT=3000
NODE_ENV=development

# Database & Caching
MONGODB_URI=mongodb://localhost:27017/shoppygo
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Firebase Credentials
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=shoppygo
AWS_EXPIRES_IN=3600

Getting Started

Prerequisites
Node.js (>= v18.x)

MongoDB Instance

Redis Server Instance

Installation
Clone the Repository:

git clone [https://github.com/your-username/shoppygo-backend.git](https://github.com/your-username/shoppygo-backend.git)
cd shoppygo-backend
Install Dependencies:

npm install
Start Development Server:

npm run start:dev
Build for Production:

npm run build
npm run start:prod

👤 Author
Abdelrahman Eid Hamed

Role: Backend Software Engineer

Specialization: Node.js / NestJS / TypeScript / GraphQL / Redis / MongoDB Architecture