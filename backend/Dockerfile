FROM node:22

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --ignore-scripts

# Copiar el esquema de Prisma y generar el cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
