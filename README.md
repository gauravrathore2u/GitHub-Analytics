# GitHub Analytics

A NestJS-based backend service for analyzing GitHub repositories, providing authentication, user management, and analytics endpoints. This project is designed to help users gain insights from GitHub data, such as pull requests and user activity, with secure authentication and modular architecture.

## Features
- JWT authentication
- User management with JWT
- Encrypted storage of GitHub Personal Access Tokens (PAT)
- Analytics endpoints for GitHub pull requests and user data
- Modular, scalable NestJS architecture
- Dockerized for easy deployment
- ESLint and TypeScript support
- Rate limiting for API endpoints

## Tech Stack
- [NestJS](https://nestjs.com/) (Node.js framework)
- TypeScript
- Docker
- JWT Authentication
- MongoDB
- Rate Limiting
- ESLint

## Getting Started

### Prerequisites
- Personal GitHub Access Token (PAT) for analytics features
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (local or cloud instance)
- Docker (optional, for containerized deployment)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run start:dev
```

### Running with Docker
```bash
docker-compose up --build
```

## Usage Notes

- **GitHub Personal Access Token (PAT) is required during signup.** You must provide a valid PAT when creating your account. This is mandatory for the analytics features to work, as the application uses your PAT to access GitHub data on your behalf.
- After signup, log in with your username and password to receive a JWT authentication token.
- **JWT token is valid for 24 hours.** After expiration, you must log in again to obtain a new token for API access.

## API Endpoints

### App

- **GET /**  
  _Check server running_  
  **Response:** `"server is up!"`

---

### Authentication (`/auth`)

- **POST /auth/signup**  
  _Sign up a new user_  
  **Body:** `{ username, password, confirmPassword, githubPat }`  
  **Response:** `{ message, userId }`  
  **Description:** Creates a new user account with username, password, and GitHub Personal Access Token (PAT).

- **POST /auth/login**  
  _Log in an existing user_  
  **Body:** `{ username, password }`  
  **Response:** `{ accessToken }`  
  **Description:** Authenticates a user and returns a JWT access token.

---

### Analytics (`/analytics`)

> All analytics endpoints require JWT authentication.

- **GET /analytics/repos/:owner/:repo/pulls**  
  _Get all open pull requests for a repository_  
  **Response:** `Array<PullRequestDto>`  
  **Description:** Returns a list of open pull requests for the specified repository.

- **GET /analytics/repos/:owner/:repo/developers/:username**  
  _Get pull request metrics for a specific developer_  
  **Response:** `DeveloperMetricsDto`  
  **Description:** Returns pull request statistics (total, merged, closed, etc.) for a developer in the specified repository.

- **GET /analytics/repos/:owner/:repo/timing**  
  _Get pull request timing metrics_  
  **Response:** `TimingMetricsDto`  
  **Description:** Returns average time to merge and the longest running open pull requests for the repository.


## Folder Structure
```
src/
  app.controller.ts        # Main app controller
  app.module.ts            # Root module
  analytics/               # Analytics feature module
    analytics.controller.ts
    analytics.service.ts
    dto/
  auth/                    # Authentication module
    auth.controller.ts
    github.strategy.ts
    jwt.strategy.ts
  users/                   # User management module
    users.service.ts
    schemas/
  utils/                   # Utility functions
```

## Environment Variables

The following environment variables are required for the application to run:

- `NODE_ENV` — Set the environment (e.g., `dev`, `prod`).
- `MONGO_URI` — MongoDB connection string (local or cloud instance).
- `JWT_SECRET` — Secret key for signing JWT tokens.
- `ENCRYPTION_KEY` — 32-character key for encrypting GitHub PATs (must be exactly 32 characters).

Create a `.env` file in the project root and set these variables before running the application.
