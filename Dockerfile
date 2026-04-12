# Production: Nitro + Prisma (migrate deploy on start)
FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
# node:24 ships npm 10; lockfile is maintained with npm 11 locally — align to avoid `npm ci` lock mismatches
RUN npm install -g npm@11
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g npm@11
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
