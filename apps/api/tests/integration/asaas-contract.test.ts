import {
  ASAAS_TEST_CARDS,
  createPayment,
  getInvoiceUrl,
  getPixQrCode,
  payWithCreditCard,
  refundPayment,
} from '../../src/integrations/asaas.client';

// O que esta suíte prova, e a principal não: que o corpo que a gente monta
// continua sendo aceito pela Asaas. Com dublê, um campo novo exigido por eles
// passaria despercebido — a dublê responde "confirmado" sem conferir nada, a
// suíte segue verde e a quebra aparece só no primeiro cliente que tentar pagar.
//
// Roda sob demanda: `npm run test:integration --workspace @eventos/api`.

// A Asaas recusa o estorno de uma cobrança recém-confirmada com
// "tente novamente em alguns instantes": entre confirmar e poder estornar
// existe uma janela de processamento do lado deles. A retentativa aqui não é
// para mascarar instabilidade, é para reproduzir a regra que eles impõem.
async function estornarQuandoPermitido(asaasPaymentId: string) {
  const TENTATIVAS = 5;
  const ESPERA_MS = 4000;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      return await refundPayment(asaasPaymentId);
    } catch (error) {
      if (tentativa === TENTATIVAS) throw error;
      await new Promise((resolve) => setTimeout(resolve, ESPERA_MS));
    }
  }

  throw new Error('inalcançável');
}

const CARD_HOLDER = {
  holderName: 'Cliente de Teste',
  expiryMonth: '12',
  expiryYear: '2030',
  ccv: '123',
};

// Sem chave, a suíte não falha: ela se declara pulada. Falhar aqui diria
// "seu código está errado", e o que aconteceu foi não ter credencial.
const temChave = Boolean(process.env.ASAAS_API_KEY);
const descrever = temChave ? describe : describe.skip;

if (!temChave) {
  console.warn(
    '\nASAAS_API_KEY não definida — suíte de contrato com a Asaas pulada. Preencha apps/api/.env para rodá-la.\n',
  );
}

descrever('contrato com a Asaas (sandbox)', () => {
  it('cria uma cobrança PIX e devolve o QR Code', async () => {
    const { asaasPaymentId } = await createPayment(
      'Cliente de Teste',
      `teste+${Date.now()}@exemplo.com`,
      42.5,
      'Cobrança de teste de contrato',
      'PIX',
    );
    expect(asaasPaymentId).toBeTruthy();

    const pix = await getPixQrCode(asaasPaymentId);
    expect(pix.encodedImage.length).toBeGreaterThan(0);
    expect(pix.payload.length).toBeGreaterThan(0);
  });

  it('aprova com o cartão de teste que aprova, e devolve o comprovante', async () => {
    const email = `teste+${Date.now()}@exemplo.com`;
    const { asaasPaymentId } = await createPayment(
      'Cliente de Teste',
      email,
      42.5,
      'Cobrança de teste de contrato',
      'CREDIT_CARD',
    );

    const { status } = await payWithCreditCard(
      asaasPaymentId,
      { ...CARD_HOLDER, number: ASAAS_TEST_CARDS.APPROVED },
      email,
    );
    expect(['CONFIRMED', 'RECEIVED']).toContain(status);

    const invoiceUrl = await getInvoiceUrl(asaasPaymentId);
    expect(invoiceUrl).toMatch(/^https?:\/\//);
  });

  it('recusa com o cartão de teste que recusa', async () => {
    const email = `teste+${Date.now()}@exemplo.com`;
    const { asaasPaymentId } = await createPayment(
      'Cliente de Teste',
      email,
      42.5,
      'Cobrança de teste de contrato',
      'CREDIT_CARD',
    );

    // A Asaas sinaliza recusa de duas formas conforme o caso: status não
    // confirmado, ou erro HTTP. O controller trata as duas como DECLINED
    // (payments.controller.ts), então o teste aceita as duas também.
    let status: string | null = null;
    try {
      ({ status } = await payWithCreditCard(
        asaasPaymentId,
        { ...CARD_HOLDER, number: ASAAS_TEST_CARDS.DECLINED },
        email,
      ));
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    if (status !== null) {
      expect(['CONFIRMED', 'RECEIVED']).not.toContain(status);
    }
  });

  it('estorna uma cobrança já confirmada', async () => {
    const email = `teste+${Date.now()}@exemplo.com`;
    const { asaasPaymentId } = await createPayment(
      'Cliente de Teste',
      email,
      42.5,
      'Cobrança de teste de contrato',
      'CREDIT_CARD',
    );
    await payWithCreditCard(
      asaasPaymentId,
      { ...CARD_HOLDER, number: ASAAS_TEST_CARDS.APPROVED },
      email,
    );

    const resultado = await estornarQuandoPermitido(asaasPaymentId);
    expect(resultado?.status).toBe('REFUNDED');
  });
});
