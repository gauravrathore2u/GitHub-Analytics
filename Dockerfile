FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g @nestjs/cli

COPY . .

RUN npm run build || (echo "❌ Build failed" && exit 1)
RUN ls -la dist  # Debug line to check if dist exists

CMD ["npm", "run", "start:prod"]
