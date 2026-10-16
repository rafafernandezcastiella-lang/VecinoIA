FROM node:24-bookworm-slim
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY server.mjs ./
COPY src ./src
COPY public ./public
RUN mkdir -p /var/lib/vecinoia && chown node:node /var/lib/vecinoia
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/var/lib/vecinoia
USER node
EXPOSE 3000
CMD ["node", "server.mjs"]
