import { Injectable, signal, computed } from '@angular/core';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<AppNotification[]>([]);
  public notifications = this.notificationsSignal.asReadonly();

  public unreadCount = computed(() => {
    return this.notificationsSignal().filter(n => !n.isRead).length;
  });

  constructor() {
    this.loadInitialNotifications();
  }

  private loadInitialNotifications(): void {
    const defaultList: AppNotification[] = [
      {
        id: 'notif_1',
        userId: 'all',
        title: 'কাজখোঁজে স্বাগতম! 🛠️',
        body: 'আপনার এলাকার বিশ্বস্ত কারিগরদের সরাসরি বুক করুন অথবা জরুরি সেবার জন্য ইনস্ট্যান্ট রিকোয়েস্ট পাঠান।',
        type: 'info',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'notif_2',
        userId: 'all',
        title: 'নিরাপত্তা বার্তা 🛡️',
        body: 'কাজের শুরুতে কারিগরকে ৪-ডিজিটের স্টার্ট ওটিপি দিন এবং কাজ শেষে রেটিং প্রদান করুন।',
        type: 'safety',
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];

    const saved = localStorage.getItem('kajkhoj_notifications');
    if (saved) {
      try {
        this.notificationsSignal.set(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    this.notificationsSignal.set(defaultList);
  }

  private persist(): void {
    localStorage.setItem('kajkhoj_notifications', JSON.stringify(this.notificationsSignal()));
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>): void {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    this.notificationsSignal.update(list => [newNotif, ...list]);
    this.persist();

    // Play subtle audio chime
    this.playChime();
  }

  public notify(body: string, type: string = 'info', title: string = 'সিস্টেম বার্তা'): void {
    const notifType = (type === 'warn' || type === 'safety' ? 'safety' : type === 'admin' ? 'admin' : 'info');
    this.addNotification({
      userId: 'current',
      title,
      body,
      type: notifType
    });
  }

  public markAsRead(id: string): void {
    this.notificationsSignal.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    this.persist();
  }

  public markAllAsRead(): void {
    this.notificationsSignal.update(list =>
      list.map(n => ({ ...n, isRead: true }))
    );
    this.persist();
  }

  public clearAll(): void {
    this.notificationsSignal.set([]);
    this.persist();
  }

  private playChime(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // AudioContext not allowed without gesture
    }
  }
}
