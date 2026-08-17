import type * as asaasModule from '../../src/integrations/asaas.client';

// A única fronteira mockada da suíte é o provedor de pagamento: é HTTP para
// fora do sistema, e depender do sandbox tornaria o resultado do teste função
// da rede. Tudo o mais (transação, update condicional, expiração lazy) roda
// contra o banco de verdade — mock de ORM não reproduz corrida por linha.
export function stubAsaas(asaas: jest.Mocked<typeof asaasModule>) {
  asaas.createPayment.mockResolvedValue({ asaasPaymentId: 'pay_teste' });
  asaas.getPixQrCode.mockResolvedValue({
    encodedImage: 'base64-irrelevante',
    payload: 'copia-e-cola',
    expirationDate: new Date().toISOString(),
  });
  asaas.payWithCreditCard.mockResolvedValue({ status: 'CONFIRMED' });
  asaas.getInvoiceUrl.mockResolvedValue('https://sandbox/invoice');
  asaas.refundPayment.mockResolvedValue({ status: 'REFUNDED' });
}
