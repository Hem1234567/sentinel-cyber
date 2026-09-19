# Sentinel Architecture

## System Design
- **Client (SDK/Middleware):** Captures requests, responses, and errors asynchronously and sends them to the Sentinel backend via non-blocking queues/API calls.
- **Sentinel Backend (Node.js/Express):** Ingests logs, processes real-time alert rules, stores data in MongoDB, and pushes live updates to the dashboard via WebSockets.
- **Sentinel Dashboard (React):** Consumes WebSocket streams for real-time visualization and interacts with the REST API for historical data and configuration.

## Database Schema (MongoDB)

### User
- `username` (String, Unique)
- `email` (String, Unique)
- `passwordHash` (String)
- `role` (Enum: Admin, Viewer)

### Project
- `name` (String)
- `apiKey` (String, Unique) - Used by SDK
- `ownerId` (ObjectId -> User)

### Log (48h TTL Index)
- `projectId` (ObjectId -> Project)
- `method` (String)
- `endpoint` (String)
- `statusCode` (Number)
- `responseTime` (Number)
- `ipAddress` (String)
- `timestamp` (Date, Indexed for 48h TTL)
- `payload` (Object - Request/Response details)

### Alert
- `projectId` (ObjectId -> Project)
- `type` (Enum: SQLi, XSS, Latency, Rate-limit)
- `message` (String)
- `status` (Enum: Open, Resolved)
- `timestamp` (Date)

## Directory Conventions & Asynchronous Queue Guidelines
- **Non-blocking Logging:** Middleware should push logs to a local memory queue or fire-and-forget HTTP request to avoid adding latency to the main application API.
- **Modular Structure:** Each domain (auth, projects, logs, alerts) should have its own controllers, services, and models.
