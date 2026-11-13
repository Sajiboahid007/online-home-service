import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '../models/job.model';

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
    return newMsg;
  }
}
