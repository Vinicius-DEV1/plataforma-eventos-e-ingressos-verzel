/**
 * Valida a mensagem de commit contra o padrão Conventional Commits
 * (feat:, fix:, chore:, docs:, test:, refactor:...), no hook commit-msg.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
