# GitHub Analytics

A powerful analytics platform built with NestJS that provides insights into GitHub repositories and user activities.

## Features

- GitHub OAuth Authentication
- Repository Analytics
- User Activity Tracking
- Custom Analytics Dashboard
- Real-time Data Updates

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- GitHub Account
- GitHub OAuth App credentials

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/GitHub-Analytics.git
cd GitHub-Analytics
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/github-analytics

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

## Authentication Setup

1. Create a GitHub OAuth application:
   - Go to GitHub Settings > Developer Settings > OAuth Apps
   - Click "New OAuth App"
   - Set the following:
     - Application name: GitHub Analytics
     - Homepage URL: `http://localhost:3000` (for development)
     - Authorization callback URL: `http://localhost:3000/auth/github/callback`

2. Copy the Client ID and Client Secret to your `.env` file

## Alternative: Personal Access Token (PAT) Authentication

You can also authenticate using a GitHub Personal Access Token (PAT) instead of OAuth:

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "GitHub Analytics")
   - Select the following scopes:
     - `repo` (Full control of private repositories)
     - `read:user` (Read user profile data)
     - `user:email` (Read user email addresses)
   - Click "Generate token"
   - Copy the generated token immediately (you won't be able to see it again)

2. Add the PAT to your `.env` file:
```
GITHUB_PAT=your_personal_access_token
```

3. When using PAT authentication:
   - The application will use the PAT to fetch your GitHub user data
   - Your user profile will be automatically created/updated in the database
   - Initialize your user profile by making a POST request to `/auth/pat/initialize`
   - After initialization, the PAT will be used for all subsequent API calls
   - This method is more suitable for automated scripts and background processes

Example initialization using curl:
```bash
curl -X POST http://localhost:3000/auth/pat/initialize
```

Note: Keep your PAT secure and never commit it to version control. The PAT provides access to your GitHub account, so treat it like a password.

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

## Login Flow

1. Visit `http://localhost:3000/auth/github` to start the GitHub OAuth flow
2. You'll be redirected to GitHub to authorize the application
3. After authorization, you'll be redirected back to the application
4. The application will create/update your user profile and log you in

## API Documentation

Once the application is running, you can access the Swagger API documentation at:
```
http://localhost:3000/api
```

## Development

```bash
# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov

# Lint code
npm run lint
```

## Docker Support

The project includes Docker configuration for easy deployment:

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
