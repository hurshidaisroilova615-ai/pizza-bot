FROM node:20-alpine

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
