FROM node:20-slim

# Prisma's schema and query engines link against OpenSSL, which the slim
# image leaves out. Without it the build succeeds and the container then
# dies on the first migration with "Schema engine error".
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The schema is copied before installing: package.json's postinstall runs
# `prisma generate`, which reads prisma/schema.prisma, so the install fails
# if the schema is not on disk yet.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 4000

# The same entry point the non-container deploy uses, so both paths run
# migrations, the demo catalog, and a prepared client catalog when one is
# named, rather than only the server.
CMD ["npm", "run", "start:prod"]
