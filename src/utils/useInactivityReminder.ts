import { useEffect, useRef, useState } from 'react';

export function useInactivityReminder(onInactiveMessage?: (msg: string) => void) {
  const [showIdleBanner, setShowIdleBanner] = useState(false);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const hasPromptedPermissionRef = useRef<boolean>(false);

  // Ask for notification permission on first user interaction
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default' && !hasPromptedPermissionRef.current) {
      hasPromptedPermissionRef.current = true;
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.log('Notification permission request error:', e);
      }
    }
  };

  useEffect(() => {
    // Reset timer on user interaction
    const handleUserActivity = () => {
      lastActiveTimeRef.current = Date.now();
      if (showIdleBanner) {
        setShowIdleBanner(false);
      }
      requestNotificationPermission();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    // 5 minutes check interval (5 * 60 * 1000 = 300,000 ms)
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActiveTimeRef.current;
      if (idleTime >= FIVE_MINUTES_MS) {
        // Send external phone/browser notification (silent: true, no sound)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('i-xon x - SHtime 2', {
              body: 'أين أنت؟ لم تلعب بعد!',
              silent: true, // بدون صوت فقط إشعار
              tag: 'idle-reminder',
            });
          } catch (e) {
            console.log('Error triggering notification:', e);
          }
        }

        setShowIdleBanner(true);
        if (onInactiveMessage) {
          onInactiveMessage('أين أنت؟ لم تلعب بعد!');
        }

        // Reset the timer so it doesn't spam every second
        lastActiveTimeRef.current = Date.now();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      clearInterval(interval);
    };
  }, [showIdleBanner, onInactiveMessage]);

  return {
    showIdleBanner,
    dismissIdleBanner: () => setShowIdleBanner(false),
  };
}
