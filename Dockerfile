FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate dev --name init && node --import ./instrumentation.mjs server.js"]