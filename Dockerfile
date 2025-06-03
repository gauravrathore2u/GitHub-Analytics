# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the NestJS app
RUN npm run build

# Expose the app port (default 3000)
EXPOSE 3000

# Run the app
CMD ["node", "dist/main"]
