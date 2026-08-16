const ASAAS_BASE_URL = 'https://sandbox.asaas.com/api/v3';

// The Asaas sandbox requires a valid CPF on the customer record, but this
// project's User has no CPF field (out of SPEC.md's User model) — a fixed,
// checksum-valid test CPF stands in for it on every customer we create.
// It never represents a real person; it only satisfies Asaas's validation.
const TEST_CPF = '24971563792';

// Asaas requires a full billing address for card holders, which User also
// doesn't have — same placeholder-for-validation approach as TEST_CPF above.
const TEST_ADDRESS = {
  postalCode: '01310930',
  addressNumber: '1000',
  phone: '11999999999',
};

// Documented sandbox-only numbers (docs.asaas.com/docs/testando-pagamento-com-cartao-de-credito):
// approval and decline are deterministic in sandbox based on the card number used, not on
// what's typed for holder name/expiry/ccv.
export const ASAAS_TEST_CARDS = {
  APPROVED: '4444444444444444',
  DECLINED: '5184019740373151',
};

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error(
      'ASAAS_API_KEY is not set. Copy apps/api/.env.example to .env.',
    );
  }
  return key;
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: getApiKey(),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asaas respondeu ${response.status}: ${body}`);
  }

  return (await response.json()) as T;
}

type AsaasCustomer = { id: string };

type AsaasPayment = { id: string; status: string; invoiceUrl: string };

type BillingType = 'PIX' | 'CREDIT_CARD';

async function createCustomer(name: string, email: string): Promise<string> {
  const customer = await asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    // notificationDisabled: every customer created here is a test double for
    // a real user, so Asaas must never email/SMS them about the charge.
    body: JSON.stringify({
      name,
      email,
      cpfCnpj: TEST_CPF,
      notificationDisabled: true,
    }),
  });
  return customer.id;
}

export async function createPayment(
  customerName: string,
  customerEmail: string,
  value: number,
  description: string,
  billingType: BillingType,
): Promise<{ asaasPaymentId: string }> {
  const customerId = await createCustomer(customerName, customerEmail);

  const payment = await asaasFetch<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType,
      value,
      dueDate: new Date().toISOString().slice(0, 10),
      description,
    }),
  });

  return { asaasPaymentId: payment.id };
}

type PixQrCode = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export async function getPixQrCode(asaasPaymentId: string): Promise<PixQrCode> {
  return asaasFetch<PixQrCode>(`/payments/${asaasPaymentId}/pixQrCode`);
}

export type CreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

// Sandbox resolves the charge synchronously here — approval/decline is
// deterministic from the card number (ASAAS_TEST_CARDS), no webhook or
// polling involved for this path, unlike PIX.
export async function payWithCreditCard(
  asaasPaymentId: string,
  card: CreditCard,
  holderEmail: string,
): Promise<{ status: string }> {
  const payment = await asaasFetch<AsaasPayment>(
    `/payments/${asaasPaymentId}/payWithCreditCard`,
    {
      method: 'POST',
      body: JSON.stringify({
        creditCard: card,
        creditCardHolderInfo: {
          name: card.holderName,
          email: holderEmail,
          cpfCnpj: TEST_CPF,
          ...TEST_ADDRESS,
        },
      }),
    },
  );
  return { status: payment.status };
}

export async function getInvoiceUrl(asaasPaymentId: string): Promise<string> {
  const payment = await asaasFetch<AsaasPayment>(`/payments/${asaasPaymentId}`);
  return payment.invoiceUrl;
}
