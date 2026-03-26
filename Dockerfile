# Multi-stage Dockerfile para produção no Google Cloud Run
# Stage 1: Build da aplicação React com injeção de variáveis em BUILD TIME
FROM node:20-alpine AS builder

WORKDIR /app

# Declarar build arguments para variáveis de ambiente
# Estes valores serão injetados durante o build pelo cloudbuild.yaml
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_TURNSTILE_SITE_KEY

# Converter build args para environment variables (Vite lê de process.env)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY

# Copiar package files primeiro (cache layer)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production=false

# Copiar código fonte
COPY . .

# Build da aplicação (gera pasta /dist)
# O Vite irá substituir import.meta.env.VITE_* com os valores das ENVs acima
RUN npm run build

# Stage 2: Servidor Nginx para servir arquivos estáticos
FROM nginx:alpine

# Remover configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copiar arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta 8080 (padrão do Cloud Run)
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
