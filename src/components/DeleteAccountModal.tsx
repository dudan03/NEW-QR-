import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  userEmail,
  onClose,
  onConfirmDelete,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmInput.trim() !== 'DELETE') return;
    try {
      setLoading(true);
      setError(null);
      await onConfirmDelete();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-red-200 dark:border-red-900 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Permanently Delete Account
            </h3>
            <p className="text-xs text-red-500 font-medium">This action cannot be reversed</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-red-50/60 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-900/40">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Deleting your account ({userEmail}) will:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Erase all your cloud-synchronized payment sessions and installments.</li>
            <li>Permanently delete customer profiles and transaction histories.</li>
            <li>Purge your business profile, settings, and merchant audit log.</li>
            <li>Immediately revoke your account session on all devices.</li>
          </ul>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Type <span className="font-bold text-red-600">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="DELETE"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase tracking-wider focus:outline-hidden focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={confirmInput.trim() !== 'DELETE' || loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
