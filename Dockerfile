FROM node:22-alpine

WORKDIR /usr/src/app

# Install dependencies from app/package.json
COPY app/package*.json ./app/
RUN npm --prefix ./app ci

# Copy project sources used at runtime
COPY app ./app
COPY back ./back
COPY front ./front

EXPOSE 3000

CMD ["npm", "--prefix", "./app", "run", "dev"]
