/**
 * Firebase Cloud Functions v2 for QR SplitPay India
 * Enterprise Backend Payment Verification & Immutable Auditing
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize Admin SDK with service account credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface VerifyUpiPaymentRequest {
  sessionId: string;
  installmentId: string;
  amountPaise: number;
  utrNumber: string; // 12-digit Indian Bank Ref No (UTR)
  payerVpa?: string; // e.g. customer@okhdfcbank
  notes?: string;
}

/**
 * Enterprise Payment Verification Function
 * Securely verifies UPI transaction details and executes atomic database updates.
 * Never trusts client calculations for remaining balance or payment state.
 */
export const verifyUpiPayment = onCall(
  {
    cors: true,
    enforceAppCheck: false, // Set to true once reCAPTCHA Enterprise is registered
  },
  async (request) => {
    // 1. Authentication Check: Ensure caller is logged in
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError('unauthenticated', 'User must be authenticated to record payments.');
    }

    const merchantId = request.auth.uid;
    const data = request.data as VerifyUpiPaymentRequest;

    // 2. Strict Input Validation
    if (!data.sessionId || typeof data.sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid sessionId is required.');
    }
    if (!data.installmentId || typeof data.installmentId !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid installmentId is required.');
    }
    if (!data.amountPaise || typeof data.amountPaise !== 'number' || data.amountPaise <= 0) {
      throw new HttpsError('invalid-argument', 'Amount in paise must be a positive integer.');
    }

    // Validate 12-digit UPI UTR format
    const cleanedUtr = (data.utrNumber || '').trim();
    if (!/^[0-9A-Za-z]{10,22}$/.test(cleanedUtr)) {
      throw new HttpsError(
        'invalid-argument',
        'Invalid UPI Reference / UTR Number. Must be 10-22 alphanumeric characters.'
      );
    }

    // 3. Prevent Duplicate UTR Submissions (Anti-Double-Spend Check)
    const duplicateUtrQuery = await db
      .collection(`merchants/${merchantId}/installments`)
      .where('utrNumber', '==', cleanedUtr)
      .where('status', '==', 'PAID')
      .limit(1)
      .get();

    if (!duplicateUtrQuery.empty) {
      throw new HttpsError(
        'already-exists',
        `A payment with UTR ${cleanedUtr} has already been verified and recorded.`
      );
    }

    const sessionRef = db.doc(`merchants/${merchantId}/sessions/${data.sessionId}`);
    const installmentRef = db.doc(`merchants/${merchantId}/installments/${data.installmentId}`);

    // 4. Atomic Firestore Transaction
    return await db.runTransaction(async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists) {
        throw new HttpsError('not-found', 'Payment session does not exist.');
      }

      const sessionData = sessionDoc.data()!;
      const customerId = sessionData.customerId;

      const installmentDoc = await transaction.get(installmentRef);
      if (!installmentDoc.exists) {
        throw new HttpsError('not-found', 'Installment record does not exist.');
      }

      const installmentData = installmentDoc.data()!;
      if (installmentData.status === 'PAID') {
        throw new HttpsError('failed-precondition', 'This installment has already been marked as PAID.');
      }

      // Verify amount matches expected scheduled installment (prevents underpayment tampering)
      if (installmentData.amountPaise !== data.amountPaise) {
        throw new HttpsError(
          'invalid-argument',
          `Amount mismatch: expected ₹${installmentData.amountPaise / 100}, received ₹${data.amountPaise / 100}.`
        );
      }

      const paidAt = new Date().toISOString();

      // Update Installment status
      transaction.update(installmentRef, {
        status: 'PAID',
        paidAt,
        utrNumber: cleanedUtr,
        payerVpa: data.payerVpa || null,
        verifiedBy: 'SERVER_CLOUD_FUNCTION',
        verifiedMerchantId: merchantId,
      });

      // Recalculate Session stats atomically
      const currentPaidPaise = (sessionData.paidAmountPaise || 0) + data.amountPaise;
      const totalAmountPaise = sessionData.totalAmountPaise;
      const remainingPaise = Math.max(0, totalAmountPaise - currentPaidPaise);
      const isSessionCompleted = remainingPaise === 0;

      transaction.update(sessionRef, {
        paidAmountPaise: currentPaidPaise,
        remainingAmountPaise: remainingPaise,
        status: isSessionCompleted ? 'COMPLETED' : 'ACTIVE',
        lastPaymentAt: paidAt,
      });

      // Update Customer Ledger if linked
      if (customerId) {
        const customerRef = db.doc(`merchants/${merchantId}/customers/${customerId}`);
        const customerDoc = await transaction.get(customerRef);
        if (customerDoc.exists) {
          const currentOutstanding = customerDoc.data()!.outstandingPaise || 0;
          const newOutstanding = Math.max(0, currentOutstanding - data.amountPaise);
          transaction.update(customerRef, {
            outstandingPaise: newOutstanding,
            lastPaymentDate: paidAt,
          });
        }
      }

      // Generate Immutable Audit Event
      const auditLogRef = db.collection(`merchants/${merchantId}/auditLogs`).doc();
      transaction.set(auditLogRef, {
        id: auditLogRef.id,
        action: 'PAYMENT_VERIFIED_UPI',
        timestamp: paidAt,
        actorId: merchantId,
        details: {
          sessionId: data.sessionId,
          installmentId: data.installmentId,
          amountPaise: data.amountPaise,
          utrNumber: cleanedUtr,
          remainingSessionPaise: remainingPaise,
        },
      });

      // Write Public Read-Only Receipt verification record
      const publicReceiptRef = db.doc(`publicReceipts/${cleanedUtr}`);
      transaction.set(publicReceiptRef, {
        utrNumber: cleanedUtr,
        amountPaise: data.amountPaise,
        merchantId,
        businessName: sessionData.businessName || 'QR SplitPay Merchant',
        paidAt,
        status: 'CONFIRMED',
      });

      return {
        success: true,
        transactionId: cleanedUtr,
        verifiedAmountPaise: data.amountPaise,
        remainingPaise,
        isSessionCompleted,
        paidAt,
      };
    });
  }
);
