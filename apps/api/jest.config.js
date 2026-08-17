/**
 * A suíte roda contra um PostgreSQL real, não contra mock do ORM: o que ela
 * precisa provar (transação, update condicional, disputa de assento) só
 * existe no banco. Ver docs/SPEC.md §6.
 *
 * Os scripts `test` e `test:watch` do package.json passam
 * NODE_OPTIONS=--experimental-vm-modules: o runtime do Prisma 7 usa import()
 * dinâmico, e o Jest só permite isso com essa flag do Node. Sem ela, toda
 * consulta falha com "a dynamic import callback was invoked without
 * --experimental-vm-modules".
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  // A suíte de contrato com a Asaas tem config própria (jest.integration.config.js)
  // e fala com a rede: fora daqui, para `npm test` continuar determinístico.
  testPathIgnorePatterns: ['<rootDir>/tests/integration/'],
  // O client do Prisma 7 importa com extensão `.js` (padrão nodenext), mas os
  // arquivos gerados são `.ts`. O Node resolve isso sozinho, o Jest não —
  // este mapa desfaz a extensão nos caminhos relativos.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  // Carrega o .env.test antes de qualquer import: o client do Prisma lê
  // DATABASE_URL no momento em que o módulo é importado.
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-db.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  // Um banco só, compartilhado: arquivos em paralelo truncariam as tabelas
  // uns dos outros no meio da execução.
  maxWorkers: 1,
  testTimeout: 30000,
  clearMocks: true,
};
