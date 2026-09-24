# Frontend de Cherry Beauty — imagen para Railway (Nginx sirve el build de Vite)

# Etapa 1: construir el frontend
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . ./
# La URL de la API se inyecta en tiempo de build (Railway variable VITE_API_URL)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Configuración SPA: cualquier ruta cae en index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]