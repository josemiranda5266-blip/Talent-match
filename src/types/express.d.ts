import type { DecodedIdToken } from 'firebase-admin/auth';
import type { DocumentReference } from 'firebase-admin/firestore';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      mercadoPagoWebhookVerified?: boolean;
      mercadoPagoWebhookEventRef?: DocumentReference;
    }
  }
}

export {};
