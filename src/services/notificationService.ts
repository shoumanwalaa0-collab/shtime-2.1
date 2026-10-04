// FCM & Background Notification Service for Shtime-2
// Automatically runs in the background based on network connectivity (Wi-Fi) and language

export interface NotificationState {
  permissionGranted: boolean;
  isOnline: boolean;
  serviceWorkerRegistered: boolean;
  updateNotificationCount: number; // 0, 1, 2, 3
  updatePhaseStartTime: number;
  lastNotificationTime: number;
  lastPeriodicTime: number;
  language: 'ar' | 'en';
}

// Play notification chime using Web Audio API (crisp, pleasant mobile chime)
export function playNotificationChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    // First chime note (A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second chime note (E6 - 1318.5Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

export function showSystemNotification(title: string, body: string, playSound = true) {
  // Only trigger if online / connected to Wi-Fi
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return;
  }

  if (playSound) {
    playNotificationChime();
  }

  // 1. Try Service Worker showNotification (Best for background / mobile)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
    });
  } else if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready
      .then((reg) => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'shtime-notif-' + Date.now(),
        });
      })
      .catch(() => {});
  }

  // 2. Direct browser Notification fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'shtime-notification-' + Date.now(),
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // Handled by service worker
    }
  }

  // 3. Dispatch in-app event for active tabs
  window.dispatchEvent(
    new CustomEvent('shtime_notification_event', {
      detail: { title, body, timestamp: Date.now() },
    })
  );
}

class FcmNotificationScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly STORAGE_KEY = 'shtime_fcm_schedule_v2';
  private updatePhaseStartTime: number;
  private updateCount: number; // 0, 1, 2, 3 (during 1 hour)
  private lastSentTime: number;
  private lastPeriodicTime: number;
  private language: 'ar' | 'en' = 'ar';
  private pendingNotificationWhileOffline = false;

  constructor() {
    const stored = this.loadState();
    // Default or resumed update phase
    this.updatePhaseStartTime = stored.updatePhaseStartTime || Date.now();
    this.updateCount = typeof stored.updateCount === 'number' ? stored.updateCount : 0;
    this.lastSentTime = stored.lastSentTime || 0;
    this.lastPeriodicTime = stored.lastPeriodicTime || 0;
    this.language = stored.language || 'ar';

    // Listen for Wi-Fi / network connection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.pendingNotificationWhileOffline) {
          this.pendingNotificationWhileOffline = false;
          this.checkAndSendScheduled();
        }
      });

      // Request permission on any user click / tap if not determined
      const autoRequestPerm = () => {
        if ('Notification' in window && Notification.permission === 'default') {
          requestNotificationPermission().catch(() => {});
        }
        window.removeEventListener('click', autoRequestPerm);
        window.removeEventListener('touchstart', autoRequestPerm);
      };
      window.addEventListener('click', autoRequestPerm);
      window.addEventListener('touchstart', autoRequestPerm);
    }
  }

  private loadState() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return {};
  }

  private saveState() {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          updatePhaseStartTime: this.updatePhaseStartTime,
          updateCount: this.updateCount,
          lastSentTime: this.lastSentTime,
          lastPeriodicTime: this.lastPeriodicTime,
          language: this.language,
        })
      );
    } catch {
      // ignore
    }
  }

  public setLanguage(lang: 'ar' | 'en') {
    this.language = lang;
    this.saveState();
  }

  public start(userLang?: 'ar' | 'en') {
    if (userLang) {
      this.language = userLang;
    }

    // Auto-request notification permissions
    requestNotificationPermission().catch(() => {});

    // Initial first update notification for the latest update if not sent yet
    if (this.updateCount === 0 && Date.now() - this.lastSentTime > 3000) {
      if (navigator.onLine) {
        this.sendUpdateNotification(1);
      } else {
        this.pendingNotificationWhileOffline = true;
      }
    }

    if (this.timer) return;

    // Check schedule every 25 seconds
    this.timer = setInterval(() => {
      this.checkAndSendScheduled();
    }, 25000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Update Notification:
   * "Now shtime-2 تحديث جديد يمكنك الان اذ انهيت المراحل يبدا الذكاء الاصطناعي بصناعه مراحل وتم اضافه قائمه SOON التي يمكنك بها رؤيه التحديثات القادمه"
   * Or in English:
   * "Now shtime-2 New update! Once you finish the stages, AI creates fresh stages for you, and the SOON menu has been added to view upcoming features."
   */
  public sendUpdateNotification(attemptIndex: number) {
    if (!navigator.onLine) {
      this.pendingNotificationWhileOffline = true;
      return;
    }

    const isEn = this.language === 'en';
    const title = isEn ? 'Now shtime-2' : 'Now shtime-2';
    const body = isEn
      ? 'New update! Once you finish the stages, AI creates fresh stages for you, and the SOON menu has been added to view upcoming features.'
      : 'تحديث جديد يمكنك الان اذ انهيت المراحل يبدا الذكاء الاصطناعي بصناعه مراحل وتم اضافه قائمه SOON التي يمكنك بها رؤيه التحديثات القادمه';

    showSystemNotification(title, body, true);
    this.updateCount = attemptIndex;
    this.lastSentTime = Date.now();
    this.saveState();
  }

  /**
   * Periodic Reminder (every 30 minutes / hourly outside the app when WiFi is connected):
   * In Arabic: "Shtime-2. العب الآن 2026_2027"
   * In English: "Shtime-2. Play now"
   */
  public sendPeriodicReminder() {
    if (!navigator.onLine) {
      return;
    }

    const isEn = this.language === 'en';
    const title = 'Shtime-2';
    const body = isEn ? 'Shtime-2. Play now' : 'Shtime-2.  الاعب الان 2026_2027';

    showSystemNotification(title, body, true);
    this.lastPeriodicTime = Date.now();
    this.lastSentTime = Date.now();
    this.saveState();
  }

  private checkAndSendScheduled() {
    // 1. WiFi / Network connection condition
    if (!navigator.onLine) {
      return;
    }

    const now = Date.now();
    const isOutsideApp = document.visibilityState === 'hidden';
    const elapsedTimeSinceStart = now - this.updatePhaseStartTime;
    const ONE_HOUR = 60 * 60 * 1000;
    const TWENTY_MINUTES = 20 * 60 * 1000;
    const THIRTY_MINUTES = 30 * 60 * 1000;

    // === 1. UPDATE NOTIFICATION PHASE (Active for 1 hour, 3 times every 20 minutes) ===
    if (elapsedTimeSinceStart <= ONE_HOUR) {
      // 1st attempt: 0m
      if (this.updateCount < 1) {
        this.sendUpdateNotification(1);
      }
      // 2nd attempt: 20m
      else if (this.updateCount < 2 && elapsedTimeSinceStart >= TWENTY_MINUTES) {
        if (now - this.lastSentTime >= TWENTY_MINUTES) {
          this.sendUpdateNotification(2);
        }
      }
      // 3rd attempt: 40m
      else if (this.updateCount < 3 && elapsedTimeSinceStart >= 2 * TWENTY_MINUTES) {
        if (now - this.lastSentTime >= TWENTY_MINUTES) {
          this.sendUpdateNotification(3);
        }
      }
    }

    // === 2. CONTINUOUS PERIODIC REMINDER (Every 30 mins, and hourly outside the app) ===
    // "وفعل دوما دوما دوما كل 30 دقيقه ليعطي هذا الاشعار لكن ان كان المستخدم يستخدم اللغه العربيه يكون عربي ان كانت يستخدم اللغه الانجليزيه يكون انجليزيه: Shtime-2 play now"
    // "اما اذا لم يكن هناك تحديث يكون كل ساعه يظهر لها كل ساعه خارج اللعبه يظهر له Shtime-2. Play now على حسب اللغه"
    const timeSinceLastPeriodic = now - this.lastPeriodicTime;
    const timeSinceAnyNotification = now - this.lastSentTime;

    // If outside app and over 30 mins since last periodic
    if (timeSinceLastPeriodic >= THIRTY_MINUTES && timeSinceAnyNotification >= TWENTY_MINUTES) {
      // Trigger periodic notification (either outside app or every 30m)
      this.sendPeriodicReminder();
    } else if (isOutsideApp && timeSinceAnyNotification >= ONE_HOUR) {
      this.sendPeriodicReminder();
    }
  }

  /**
   * Reset update schedule for a fresh 1-hour broadcast
   */
  public triggerNewUpdateBroadcast() {
    this.updatePhaseStartTime = Date.now();
    this.updateCount = 0;
    this.lastSentTime = 0;
    this.saveState();
    if (navigator.onLine) {
      this.sendUpdateNotification(1);
    } else {
      this.pendingNotificationWhileOffline = true;
    }
  }

  public getStatus() {
    const now = Date.now();
    const elapsed = now - this.updatePhaseStartTime;
    const inFirstHour = elapsed <= 60 * 60 * 1000;
    return {
      isOnline: navigator.onLine,
      isOutsideApp: document.visibilityState === 'hidden',
      hasPermission: 'Notification' in window && Notification.permission === 'granted',
      updateCount: this.updateCount,
      inFirstHour,
      lastSentTime: this.lastSentTime,
      language: this.language,
    };
  }
}

export const fcmScheduler = new FcmNotificationScheduler();
