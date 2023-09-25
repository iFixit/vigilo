FROM node:18-bullseye-slim

RUN apt-get update --fix-missing && \
    apt-get -y upgrade && \
    apt-get install -y chromium && \
    apt-get clean

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile
RUN pnpm run build

CMD ["pnpm", "start"]