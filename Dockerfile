FROM node:20-alpine

WORKDIR /app

# Install only runtime dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "main.js", "--host", "0.0.0.0", "--port", "3000", "--cache", "./cache"]
