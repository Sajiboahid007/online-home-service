import { Injectable, signal, inject } from '@angular/core';
import { ChatMessage } from '../models/job.model';
import { ToastService } from './toast.service';
import { NotificationService } from './notification.service';

export interface VoiceNoteMeta {
  durationSec: number;
  audioWave: number[];
}

export interface EnhancedChatMessage extends ChatMessage {
  isVoiceNote?: boolean;
  voiceMeta?: VoiceNoteMeta;
  senderRole?: 'customer' | 'worker';
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);

  private messagesSignal = signal<Record<string, EnhancedChatMessage[]>>({
    'job_demo_101': [
      {
        id: 'msg_1',
        senderId: 'worker_rahim_1',
        senderName: 'মোঃ রহিম উদ্দিন',
        senderRole: 'worker',
        text: 'আসসালামু আলাইকুম স্যার, আমি সাভার বাজার মোড় থেকে রওনা দিয়েছি।',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      },
      {
        id: 'msg_2',
        senderId: 'user_customer_demo_1',
        senderName: 'তানভীর আহমেদ',
        senderRole: 'customer',
        text: 'ওয়ালাইকুমুস সালাম রহিম ভাই, কতক্ষণ লাগবে আসতে?',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      },
      {
        id: 'msg_3',
        senderId: 'worker_rahim_1',
        senderName: 'মোঃ রহিম উদ্দিন',
        senderRole: 'worker',
        text: 'ভয়েস বার্তা (০:১৮ সেকেন্ড)',
        isVoiceNote: true,
        voiceMeta: {
          durationSec: 18,
          audioWave: [30, 60, 45, 80, 95, 60, 40, 70, 85, 50, 65, 40, 75, 30]
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
      },
      {
        id: 'msg_4',
        senderId: 'user_customer_demo_1',
        senderName: 'তানভীর আহমেদ',
        senderRole: 'customer',
        text: 'ঠিক আছে, বাসার নিচতলার পানির মেইন লাইনে সমস্যা। চলে আসুন।',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ]
  });

  public messages = this.messagesSignal.asReadonly();

  // Active chat modal tracking
  public activeChatJobId = signal<string | null>(null);

  // Unread message count per job
  private unreadCountsSignal = signal<Record<string, number>>({});
  public unreadCounts = this.unreadCountsSignal.asReadonly();

  // Quick reply presets
  public customerPresets = [
    'আমি বাসায় আছি, চলে আসুন',
    'গেট খুলে দেওয়া আছে',
    'লোকেশন খুঁজে পেতে কী সমস্যা হচ্ছে?',
    'একটু দ্রুত এলে ভালো হয়',
    'কলিং বেল বাজান'
  ];

  public workerPresets = [
    'আমি রওনা দিয়েছি',
    '৫ মিনিটের মধ্যে পৌঁছাবো',
    'বাসার সামনে দাঁড়িয়ে আছি',
    'গেট নম্বর কত দয়া করে বলবেন?'
  ];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem('kajkhoj_chat_messages');
    if (saved) {
      try {
        this.messagesSignal.set(JSON.parse(saved));
      } catch (e) {}
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('kajkhoj_chat_messages', JSON.stringify(this.messagesSignal()));
  }

  public getMessagesForJob(jobId: string): EnhancedChatMessage[] {
    return this.messagesSignal()[jobId] || [];
  }

  public getUnreadCount(jobId: string): number {
    return this.unreadCountsSignal()[jobId] || 0;
  }

  public markAsRead(jobId: string): void {
    this.unreadCountsSignal.update(counts => {
      if (!counts[jobId]) return counts;
      const copy = { ...counts };
      delete copy[jobId];
      return copy;
    });
  }

  /**
   * Plays a pleasant two-tone Web Audio chime when a new message arrives.
   */
  public playChatChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.1); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  public sendMessage(
    jobId: string,
    senderId: string,
    senderName: string,
    senderRole: 'customer' | 'worker',
    text: string
  ): EnhancedChatMessage {
    const newMsg: EnhancedChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    this.messagesSignal.update(store => {
      const list = store[jobId] ? [...store[jobId], newMsg] : [newMsg];
      return { ...store, [jobId]: list };
    });

    this.saveToStorage();

    // Trigger realistic partner simulation in demo mode
    this.triggerPartnerSimulation(jobId, text, senderRole);

    return newMsg;
  }

  public sendVoiceNote(
    jobId: string,
    senderId: string,
    senderName: string,
    senderRole: 'customer' | 'worker',
    durationSec: number = 15
  ): EnhancedChatMessage {
    const waves = Array.from({ length: 14 }, () => Math.floor(25 + Math.random() * 75));
    const newMsg: EnhancedChatMessage = {
      id: `vn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId,
      senderName,
      senderRole,
      text: `ভয়েস বার্তা (০:${durationSec < 10 ? '0' + durationSec : durationSec} সেকেন্ড)`,
      isVoiceNote: true,
      voiceMeta: {
        durationSec,
        audioWave: waves
      },
      createdAt: new Date().toISOString()
    };

    this.messagesSignal.update(store => {
      const list = store[jobId] ? [...store[jobId], newMsg] : [newMsg];
      return { ...store, [jobId]: list };
    });

    this.saveToStorage();

    this.triggerPartnerSimulation(jobId, 'ভয়েস বার্তা পাঠানো হয়েছে', senderRole);

    return newMsg;
  }

  /**
   * Simulates a real-time partner response with chime, toast, and notification
   */
  private triggerPartnerSimulation(jobId: string, userText: string, userRole: 'customer' | 'worker'): void {
    setTimeout(() => {
      let replyText = '';
      let replySenderName = '';
      let replySenderId = '';
      let replyRole: 'customer' | 'worker';

      if (userRole === 'customer') {
        replySenderName = 'মোঃ রহিম উদ্দিন';
        replySenderId = 'worker_rahim_1';
        replyRole = 'worker';

        const lower = userText.toLowerCase();
        if (lower.includes('where') || lower.includes('কোথায়') || lower.includes('কতক্ষণ') || lower.includes('late') || lower.includes('time')) {
          replyText = 'জি স্যার, আমি কাছাকাছি চলে এসেছি। ইনশাআল্লাহ ৩-৪ মিনিটের মধ্যে পৌঁছে কল দিচ্ছি।';
        } else if (lower.includes('গেট') || lower.includes('open') || lower.includes('door') || lower.includes('বাসা') || lower.includes('home')) {
          replyText = 'জি ধন্যবাদ স্যার, গেটের সামনে এসে বেল বাজাচ্ছি।';
        } else if (lower.includes('টুলস') || lower.includes('সামগ্রী') || lower.includes('parts') || lower.includes('কাজ')) {
          replyText = 'জি স্যার, প্রয়োজনীয় সকল টুলস ও স্পেয়ার পার্টস সাথে নিয়ে এসেছি।';
        } else {
          replyText = 'জি স্যার বুঝতে পেরেছি, আমি যথাসময়ে উপস্থিত হচ্ছি।';
        }
      } else {
        replySenderName = 'তানভীর আহমেদ';
        replySenderId = 'user_customer_demo_1';
        replyRole = 'customer';
        replyText = 'ঠিক আছে ভাই, গেট খোলা আছে। আপনি দ্রুত চলে আসুন।';
      }

      const partnerMsg: EnhancedChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: replySenderId,
        senderName: replySenderName,
        senderRole: replyRole,
        text: replyText,
        createdAt: new Date().toISOString()
      };

      this.messagesSignal.update(store => {
        const list = store[jobId] ? [...store[jobId], partnerMsg] : [partnerMsg];
        return { ...store, [jobId]: list };
      });
      this.saveToStorage();

      // 1. Play audio notification chime
      this.playChatChime();

      // 2. Visible Toast Alert
      this.toastService.info(partnerMsg.text, `💬 ${partnerMsg.senderName}`);

      // 3. System Notification
      this.notificationService.notify(
        `${partnerMsg.senderName}: "${partnerMsg.text}"`,
        'info',
        'নতুন চ্যাট বার্তা'
      );

      // 4. Update unread count if modal is currently closed
      if (this.activeChatJobId() !== jobId) {
        this.unreadCountsSignal.update(c => ({
          ...c,
          [jobId]: (c[jobId] || 0) + 1
        }));
      }
    }, 2000);
  }
}
