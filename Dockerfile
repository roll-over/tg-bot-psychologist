FROM node:20.5-slim AS base

COPY ./ /src
WORKDIR /src

RUN corepack enable    
RUN pnpm install