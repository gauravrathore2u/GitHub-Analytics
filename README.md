# GitHub Analytics

A powerful analytics platform built with [NestJS](https://nestjs.com/) that provides insights into GitHub repositories and developer activities.

## Features

- GitHub OAuth and Personal Access Token (PAT) Authentication
- Repository Pull Request Analytics
- Developer Pull Request Metrics
- Pull Request Timing Metrics (e.g., average time to merge, longest open PRs)
- User Profile Management (MongoDB)
- Swagger API Documentation
- Docker Support

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Docker)
- GitHub Account
- GitHub OAuth App credentials **or** a GitHub Personal Access Token (PAT)

## Project Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/GitHub-Analytics.git
   cd GitHub-Analytics
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory. Example:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/github-analytics

   # GitHub OAuth Configuration (for OAuth login)
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

   # GitHub PAT (for PAT authentication)
   GITHUB_PAT=your_personal_access_token
   ```

## Authentication Setup

### GitHub OAuth

1. Create a GitHub OAuth application:
   - Go to GitHub Settings > Developer Settings > OAuth Apps
   - Click "New OAuth App"
   - Set:
     - Application name: GitHub Analytics
     - Homepage URL: `http://localhost:3000`
     - Authorization callback URL: `http://localhost:3000/auth/github/callback`
2. Copy the Client ID and Client Secret to your `.env` file.

### Personal Access Token (PAT)

1. Create a GitHub PAT with scopes:
   - `repo`
   - `read:user`
   - `user:email`
2. Add the PAT to your `.env` file as `GITHUB_PAT`.
3. Initialize your user profile:
   ```bash
   curl -X POST http://localhost:3000/auth/pat/initialize
   ```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Endpoints

- **Authentication**
  - `GET /auth/github` — Start OAuth login
  - `GET /auth/github/callback` — OAuth callback
  - `POST /auth/pat/initialize` — Initialize user with PAT

- **Analytics**
  - `GET /analytics/repos/:owner/:repo/pulls` — List open PRs for a repo
  - `GET /analytics/repos/:owner/:repo/developers/:username` — PR metrics for a developer
  - `GET /analytics/repos/:owner/:repo/timing` — PR timing metrics

## API Documentation

Swagger UI is available at:  
[http://localhost:3000/api](http://localhost:3000/api)

## Development

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov

# Lint code
npm run lint
```

## Docker Support

The project includes Docker configuration:

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.