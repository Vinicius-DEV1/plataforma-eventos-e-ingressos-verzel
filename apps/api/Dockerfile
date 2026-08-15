# O contexto de build é a raiz do repositório (ver docker-compose.yml): o
# monorepo usa npm workspaces, e o lockfile fica na raiz. Copiar apenas
# apps/api deixaria o npm sem como resolver as dependências.

# ---------- Estágio de build ----------
FROM node:24-slim AS builder

WORKDIR /app

# Desliga o script `prepare`, que instala os hooks do Husky: dentro da imagem
# não existe repositório Git nem commit a validar.
ENV HUSKY=0

# Manifestos primeiro: enquanto eles não mudarem, o Docker reaproveita a
# camada de dependências em vez de reinstalar tudo a cada alteração de código.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm ci

COPY apps/api ./apps/api

# `npm run build` dispara o `prebuild` (prisma generate) antes do tsc.
RUN npm run build --workspace @eventos/api

# ---------- Estágio de execução ----------
FROM node:24-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Sem as dependências de desenvolvimento: TypeScript, tsx e afins não são
# necessários para executar o código já compilado.
#
# `--ignore-scripts` é obrigatório aqui: o script `prepare` da raiz invoca o
# Husky, que é dependência de desenvolvimento e portanto não existe nesta
# instalação. Instalar hooks de Git numa imagem de produção não faria sentido
# de qualquer forma — não há repositório nem commits dentro do container.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Apenas o resultado da compilação. O client do Prisma vem junto, porque é
# gerado em src/generated e compilado para dist/generated.
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# O schema acompanha a imagem para permitir rodar migrations em produção.
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/

# Usuário sem privilégios: a imagem base já traz o usuário `node`.
USER node

EXPOSE 3333

CMD ["node", "apps/api/dist/server.js"]
