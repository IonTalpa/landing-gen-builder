# Landing-Gen Dockerfile (Fixed)
FROM node:20-alpine AS base

# --- deps: sadece bağımlılıkları kur, script ÇALIŞTIRMA ---
FROM base AS deps
# Prisma için openssl, sharp için libc6-compat
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Lockfile varsa kullan, yoksa sorun etme
COPY package.json package-lock.json* ./

# prepare/postinstall gibi script'leri KAPAT (schema henüz yok)
RUN npm install --ignore-scripts

# --- builder: kaynak + prisma + build ---
FROM base AS builder
WORKDIR /app

# node_modules'ı taşı
COPY --from=deps /app/node_modules ./node_modules

# Tüm kaynak dosyaları kopyala
COPY . .

# Prisma client üret (artık prisma/schema.prisma burada var)
RUN npx prisma generate

# Next.js build
RUN npm run build

# --- runner: production image ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Sistem kullanıcıları
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Public dosyalar
COPY --from=builder /app/public ./public

# Prerender cache klasörü
RUN mkdir .next && chown nextjs:nodejs .next

# Next standalone çıktısı
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma runtime dosyaları
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Healthcheck scriptini da kopyala (aksi halde HEALTHCHECK hata verir)
COPY --from=builder /app/healthcheck.js ./healthcheck.js

# Kalıcı veri klasörleri
RUN mkdir -p /app/data/uploads /app/data/exports /app/data \
 && chown -R nextjs:nodejs /app/data

# Volume mount
VOLUME ["/app/data"]

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Next.js standalone entrypoint
CMD ["node", "server.js"]
