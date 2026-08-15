FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

# Copy prisma schema and config before generating client
COPY prisma ./prisma
COPY prisma.config.ts ./

# Generate Prisma client (needs a dummy DATABASE_URL to pass validation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy rest of source
COPY . .

EXPOSE 4000

# Apply migrations then start dev server
CMD sh -c "npx prisma migrate deploy --schema=prisma/schema.prisma && npm run dev"
