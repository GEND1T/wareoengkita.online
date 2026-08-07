import crypto from 'crypto';

// ============================================================
// Duitku Payment Gateway Service
// Handles all communication with Duitku API (sandbox & production)
// Docs: https://docs.duitku.com/api/id/
// ============================================================

const DUITKU_CONFIG = {
  merchantCode: process.env.DUITKU_MERCHANT_CODE || '',
  apiKey: process.env.DUITKU_API_KEY || '',
  isSandbox: process.env.DUITKU_SANDBOX === 'true',
  callbackUrl: process.env.DUITKU_CALLBACK_URL || '',
  returnUrl: process.env.DUITKU_RETURN_URL || '',
};

function getBaseUrl(): string {
  return DUITKU_CONFIG.isSandbox
    ? 'https://sandbox.duitku.com/webapi'
    : 'https://passport.duitku.com/webapi';
}

// ---- Signature Generators (HMAC-SHA256) ----

function generatePaymentMethodSignature(amount: number, datetime: string): string {
  // Formula: merchantCode + amount + datetime
  const stringToSign = DUITKU_CONFIG.merchantCode + amount + datetime;
  return crypto
    .createHmac('sha256', DUITKU_CONFIG.apiKey)
    .update(stringToSign)
    .digest('hex');
}

function generateInquirySignature(merchantOrderId: string, paymentAmount: number): string {
  // Formula: merchantCode + merchantOrderId + paymentAmount
  const stringToSign = DUITKU_CONFIG.merchantCode + merchantOrderId + paymentAmount;
  return crypto
    .createHmac('sha256', DUITKU_CONFIG.apiKey)
    .update(stringToSign)
    .digest('hex');
}

function generateCheckSignature(merchantOrderId: string): string {
  // Formula: merchantCode + merchantOrderId
  const stringToSign = DUITKU_CONFIG.merchantCode + merchantOrderId;
  return crypto
    .createHmac('sha256', DUITKU_CONFIG.apiKey)
    .update(stringToSign)
    .digest('hex');
}

export function generateCallbackSignature(merchantCode: string, amount: string, merchantOrderId: string): string {
  // Formula: merchantCode + amount + merchantOrderId
  const stringToSign = merchantCode + amount + merchantOrderId;
  return crypto
    .createHmac('sha256', DUITKU_CONFIG.apiKey)
    .update(stringToSign)
    .digest('hex');
}

function getFormattedDatetime(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ---- API Calls ----

export interface DuitkuPaymentMethod {
  paymentMethod: string;
  paymentName: string;
  paymentImage: string;
  totalFee: string;
}

export interface DuitkuPaymentMethodResponse {
  paymentFee: DuitkuPaymentMethod[];
  responseCode: string;
  responseMessage: string;
}

/**
 * Get available payment methods from Duitku API
 * POST /api/merchant/paymentmethod/getpaymentmethod
 */
export async function getPaymentMethods(amount: number): Promise<DuitkuPaymentMethodResponse> {
  const datetime = getFormattedDatetime();
  const signature = generatePaymentMethodSignature(amount, datetime);

  const params = {
    merchantcode: DUITKU_CONFIG.merchantCode,
    amount: amount.toString(),
    datetime,
    signature,
  };

  const url = `${getBaseUrl()}/api/merchant/paymentmethod/getpaymentmethod`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Duitku getPaymentMethods failed (${response.status}): ${errBody}`);
  }

  return response.json();
}

export interface CreateTransactionParams {
  merchantOrderId: string;
  paymentAmount: number;
  paymentMethod: string;
  productDetails: string;
  email: string;
  phoneNumber?: string;
  customerVaName: string;
  additionalParam?: string;
  merchantUserInfo?: string;
  itemDetails?: Array<{ name: string; price: number; quantity: number }>;
  customerDetail?: {
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    billingAddress?: {
      firstName: string;
      lastName?: string;
      address: string;
      city: string;
      postalCode: string;
      phone: string;
      countryCode: string;
    };
    shippingAddress?: {
      firstName: string;
      lastName?: string;
      address: string;
      city: string;
      postalCode: string;
      phone: string;
      countryCode: string;
    };
  };
  expiryPeriod?: number; // minutes
}

export interface DuitkuInquiryResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber: string;
  qrString: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

/**
 * Duitku Expiry Period Helper (in minutes) based on Official Duitku Channel Specs:
 * Credit Card (VC): 30 mins
 * OVO (OV) / ShopeePay (SP) / QRIS (LQ, QR) / Jenius (JP): 10 mins
 * OVO Account Link (OL): 15 mins
 * NOBU QRIS (NQ) / LinkAja (LA): 24 mins
 * ShopeePay Account Link (SL): 30 mins
 * ATOME (AT): 720 mins
 * VA (BC, M2, B1, A1, NC, BT, FT, AG) / DANA (DA) / Indodana (DN) / Tokopedia (TK): 1440 mins
 */
export function getDuitkuExpiryMinutes(paymentMethodCode: string): number {
  const code = (paymentMethodCode || '').toUpperCase().trim();
  switch (code) {
    case 'VC':
      return 30;
    case 'OV':
    case 'SP':
    case 'LQ':
    case 'QR':
    case 'JP':
      return 10;
    case 'OL':
      return 15;
    case 'NQ':
    case 'LA':
      return 24;
    case 'SL':
      return 30;
    case 'AT':
      return 720;
    case 'DA':
    case 'DN':
    case 'TK':
    case 'BC':
    case 'M2':
    case 'B1':
    case 'A1':
    case 'I1':
    case 'NC':
    case 'BT':
    case 'FT':
    case 'AG':
    default:
      return 1440;
  }
}

/**
 * Create a new transaction via Duitku Inquiry API
 * POST /api/merchant/v2/inquiry
 */
export async function createTransaction(data: CreateTransactionParams): Promise<DuitkuInquiryResponse> {
  const signature = generateInquirySignature(data.merchantOrderId, data.paymentAmount);
  const defaultExpiry = getDuitkuExpiryMinutes(data.paymentMethod);

  const params: Record<string, any> = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    paymentAmount: data.paymentAmount,
    paymentMethod: data.paymentMethod,
    merchantOrderId: data.merchantOrderId,
    productDetails: data.productDetails,
    additionalParam: data.additionalParam || '',
    merchantUserInfo: data.merchantUserInfo || '',
    customerVaName: data.customerVaName,
    email: data.email,
    phoneNumber: data.phoneNumber || '',
    callbackUrl: DUITKU_CONFIG.callbackUrl,
    returnUrl: DUITKU_CONFIG.returnUrl,
    signature,
    expiryPeriod: data.expiryPeriod || defaultExpiry,
  };

  if (data.itemDetails) {
    params.itemDetails = data.itemDetails;
  }
  if (data.customerDetail) {
    params.customerDetail = data.customerDetail;
  }

  const url = `${getBaseUrl()}/api/merchant/v2/inquiry`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Duitku createTransaction failed (${response.status}): ${errBody}`);
  }

  return response.json();
}

export interface DuitkuCheckResponse {
  merchantOrderId: string;
  reference: string;
  amount: string;
  fee: string;
  statusCode: string;
  statusMessage: string;
}

/**
 * Check transaction status via Duitku API
 * POST /api/merchant/transactionStatus
 */
export async function checkTransactionStatus(merchantOrderId: string): Promise<DuitkuCheckResponse> {
  const signature = generateCheckSignature(merchantOrderId);

  const params = {
    merchantCode: DUITKU_CONFIG.merchantCode,
    merchantOrderId,
    signature,
  };

  const url = `${getBaseUrl()}/api/merchant/transactionStatus`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Duitku checkTransaction failed (${response.status}): ${errBody}`);
  }

  return response.json();
}

/**
 * Verify callback signature from Duitku
 */
export function verifyCallbackSignature(
  merchantCode: string,
  amount: string,
  merchantOrderId: string,
  receivedSignature: string
): boolean {
  const calcSignature = generateCallbackSignature(merchantCode, amount, merchantOrderId);
  return calcSignature === receivedSignature;
}
