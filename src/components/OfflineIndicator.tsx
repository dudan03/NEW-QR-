import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center justify-between sm:justify-start gap-2.5 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-semibold shadow-lg animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
        <span>Offline Mode — All changes saved locally and will sync when reconnected.</span>
      </div>
    </div>
  );
};
