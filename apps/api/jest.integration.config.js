/**
 * Suíte de contrato com a Asaas: fala com o sandbox de verdade, sem dublê.
 *
 * Separada da suíte principal de propósito. As duas quebram por motivos
 * diferentes: `npm test` vermelho significa erro no nosso código; esta aqui
 * vermelha significa que o acordo com o provedor mudou, ou que a rede caiu.
 * Misturar as duas faria uma queda de internet apontar para o código.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  // O client do Prisma 7 importa com extensão `.js` (padrão nodenext), mas os
  // arquivos gerados são `.ts`. O Node resolve isso sozinho, o Jest não —
  // este mapa desfaz a extensão nos caminhos relativos.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  setupFiles: ['<rootDir>/tests/integration/setup-env.ts'],
  maxWorkers: 1,
  // Cada caso são três ou quatro idas e voltas até o sandbox.
  testTimeout: 60000,
};
