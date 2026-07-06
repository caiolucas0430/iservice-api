FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

RUN npm ci --only=production

ENV NODE_ENV=production
ENV PORT=8404

EXPOSE 8404

CMD ["npm", "run", "start:prod"]
