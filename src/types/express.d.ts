import type { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      mercadoPagoWebhookVerified?: boolean;
    }
  }
}

export {};
