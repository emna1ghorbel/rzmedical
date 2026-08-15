FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

# Copy rest of source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
