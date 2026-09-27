import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInactivityTimeoutOptions {
  timeoutMs?: number; // default: 15 minutes (15 * 60 * 1000 = 900,000 ms)
  warningMs?: number; // default: 60 seconds warning before auto-logout
  enabled?: boolean;
  onTimeout: () => void;
  onWarning?: (secondsRemaining: number) => void;
}

export function useInactivityTimeout({
  timeoutMs = 15 * 60 * 1000, // 15 minutes
  warningMs = 60 * 1000,       // 60 seconds
  enabled = true,
  onTimeout,
  onWarning,
}: UseInactivityTimeoutOptions) {
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.round(warningMs / 1000));
  
  const lastActivityRef = useRef<number>(Date.now());
  const timerCheckRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarningActive) {
      setIsWarningActive(false);
      setSecondsLeft(Math.round(warningMs / 1000));
    }
  }, [isWarningActive, warningMs]);

  useEffect(() => {
    if (!enabled) {
      setIsWarningActive(false);
      return;
    }

    lastActivityRef.current = Date.now();

    // DOM events that qualify as user activity
    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'touchmove',
      'scroll',
      'click',
    ];

    const handleUserActivity = () => {
      // Throttle activity updates to once every 2 seconds
      if (Date.now() - lastActivityRef.current > 2000) {
        lastActivityRef.current = Date.now();
        if (isWarningActive) {
          setIsWarningActive(false);
        }
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const inactiveDuration = Date.now() - lastActivityRef.current;
        if (inactiveDuration >= timeoutMs) {
          onTimeout();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Main heartbeat interval checking idle time every second
    timerCheckRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= timeoutMs) {
        // Time is up -> Trigger auto-logout
        clearInterval(timerCheckRef.current);
        clearInterval(countdownIntervalRef.current);
        setIsWarningActive(false);
        onTimeout();
      } else if (elapsed >= timeoutMs - warningMs) {
        // In warning zone (< 60 seconds remaining)
        const remainingSeconds = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
        setIsWarningActive(true);
        setSecondsLeft(remainingSeconds);
        if (onWarning) {
          onWarning(remainingSeconds);
        }
      } else {
        setIsWarningActive((prev) => (prev ? false : prev));
      }
    }, 1000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerCheckRef.current) clearInterval(timerCheckRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [enabled, timeoutMs, warningMs, onTimeout, onWarning]);

  return {
    isWarningActive,
    secondsLeft,
    resetTimer,
  };
}
