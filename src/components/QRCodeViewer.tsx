import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { Installment, PaymentSession, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import {
  Copy,
  Check,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Maximize2,
  Share2,
  X,
} from 'lucide-react';

interface QRCodeViewerProps {
  session: PaymentSession;
  installment: Installment;
  totalInstallments: number;
  language: SupportedLanguage;
  onMarkReceived: (installment: Installment) => void;
  onClose?: () => void;
  onSelectInstallment?: (index: number) => void;
}

export const QRCodeViewer: React.FC<QRCodeViewerProps> = ({
  session,
  installment,
  totalInstallments,
  language,
  onMarkReceived,
  onClose,
  onSelectInstallment,
}) => {
  const t = translations[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (canvasRef.current && installment.paymentUri) {
      QRCode.toCanvas(
        canvasRef.current,
        installment.paymentUri,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR code generation error', error);
        }
      );
    }
  }, [installment.paymentUri, installment.id]);

  // Render high-res QR for fullscreen customer view
  useEffect(() => {
    if (showFullscreen && fullscreenCanvasRef.current && installment.paymentUri) {
      QRCode.toCanvas(
        fullscreenCanvasRef.current,
        installment.paymentUri,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (error) => {
          if (error) console.error('Fullscreen QR error', error);
        }
      );
    }
  }, [showFullscreen, installment.paymentUri]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(session.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSharePayment = async () => {
    const shareText = `*Payment Request from ${session.payeeName || 'Merchant'}*\nInstallment ${installment.sequence} of ${totalInstallments}: ${formatPaise(installment.amountPaise)}\nCustomer: ${session.customerName || 'Customer'}\nPay via UPI: ${installment.paymentUri}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `UPI Payment - ${formatPaise(installment.amountPaise)}`,
          text: shareText,
          url: installment.paymentUri,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(installment.paymentUri);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const isConfirmed =
    installment.status === 'MANUALLY_CONFIRMED' || installment.status === 'SUCCESS';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-5 w-full max-w-md mx-auto box-border">
      {/* Sequence Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Payment {installment.sequence} of {totalInstallments}
          </span>
          {session.isDemo && (
            <span className="ml-2 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              DEMO DATA
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.states[installment.status]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {t.states[installment.status]}
            </span>
          )}
        </div>
      </div>

      {/* Static QR Code Presentation */}
      <div
        key={installment.id}
        className="w-full flex flex-col items-center"
      >
        {/* Amount Display */}
        <div className="text-center py-3">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(installment.amountPaise)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
            <span>{session.customerName || 'Customer'}</span>
            {session.invoiceId && (
              <>
                <span>·</span>
                <span>{session.invoiceId}</span>
              </>
            )}
          </div>
        </div>

        {/* QR Code Container with Tap-to-Enlarge for Smartphones */}
        <div
          onClick={() => setShowFullscreen(true)}
          className="relative flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 my-1 w-full max-w-[280px] cursor-pointer group active:scale-98 transition-transform"
          title="Tap to enlarge QR for customer"
        >
          <div className="bg-white p-3 rounded-xl shadow-xs ring-1 ring-slate-900/5 transition-all relative">
            <canvas ref={canvasRef} className="max-w-[200px] max-h-[200px] w-full h-auto block" />
            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 rounded-xl transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 shadow-md">
                <Maximize2 className="w-3 h-3" />
                <span>Enlarge</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-2.5">
            <Maximize2 className="w-3 h-3" />
            <span>Tap to Enlarge for Customer</span>
          </div>
        </div>
      </div>

      {/* Payee UPI ID & Quick Actions row */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs mt-2.5 gap-2">
        <div className="truncate min-w-0">
          <span className="text-slate-400 block text-[10px]">Merchant UPI</span>
          <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate block">
            {session.upiId}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyUpi}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Copy UPI ID"
          >
            {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleSharePayment}
            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-900/60"
            title="Share payment link to customer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Manual Verification Non-Provider Notice */}
      <div className="my-3 px-3 py-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold block">Manual Verification Mode</span>
          <span>Status is not automatically verified by banks. Verify independently before recording.</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-3">
        {!isConfirmed ? (
          <button
            type="button"
            onClick={() => {
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ['#10b981', '#3b82f6', '#f59e0b', '#6366f1'],
                });
              } catch {}
              onMarkReceived(installment);
            }}
            className="w-full min-h-[46px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{t.actions.markAsReceived}</span>
          </button>
        ) : (
          <div className="w-full min-h-[46px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t.states.MANUALLY_CONFIRMED}</span>
          </div>
        )}
      </div>

      {/* Installment Switcher Carousel / Pagination (Touch-optimized for thumbs) */}
      {totalInstallments > 1 && onSelectInstallment && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 flex-wrap">
          {session.installments.map((inst, idx) => {
            const isCurrent = inst.id === installment.id;
            const instConfirmed =
              inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => onSelectInstallment(idx)}
                className={`min-w-[42px] h-9 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/20'
                    : instConfirmed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>#{inst.sequence}</span>
                {instConfirmed && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Smartphone Fullscreen Show-to-Customer Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-left">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Scan to Pay
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {session.payeeName || 'Merchant'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullscreen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums">
                {formatPaise(installment.amountPaise)}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Installment {installment.sequence} of {totalInstallments} · {session.customerName || 'Customer'}
              </p>
            </div>

            {/* High-res QR */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto shadow-inner">
              <canvas ref={fullscreenCanvasRef} className="max-w-[260px] w-full h-auto block mx-auto" />
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Open <strong>GPay, PhonePe, Paytm, or BHIM</strong> & scan to pay
            </p>

            <button
              type="button"
              onClick={() => setShowFullscreen(false)}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95"
            >
              Done / Return to App
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

