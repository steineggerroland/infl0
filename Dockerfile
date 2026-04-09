# Production: Nitro + Prisma (migrate deploy on start)
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
