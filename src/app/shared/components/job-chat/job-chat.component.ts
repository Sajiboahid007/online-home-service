import { Component, Input, Output, EventEmitter, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, EnhancedChatMessage } from '../../../core/services/chat.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { BnNumberPipe } from '../../pipes/bn-number.pipe';

@Component({
  selector: 'app-job-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, TimeAgoPipe, BnNumberPipe],
  templateUrl: './job-chat.component.html',
  styleUrl: './job-chat.component.scss'
})
export class JobChatComponent implements AfterViewChecked {
  @Input({ required: true }) jobId!: string;
  @Input({ required: true }) currentUserId!: string;
  @Input({ required: true }) currentUserName!: string;
  @Input({ required: true }) currentUserRole!: 'customer' | 'worker';
  @Input() partnerName: string = 'পার্টনার';
  @Input() partnerPhoto: string = '';
  @Input() partnerRoleBn: string = 'কারিগর';

  @Output() closeChat = new EventEmitter<void>();

  @ViewChild('messagesScroll') private messagesScrollContainer!: ElementRef<HTMLDivElement>;

  private chatService = inject(ChatService);

  public inputText = signal<string>('');
  public isRecordingVoice = signal<boolean>(false);
  public recordingSeconds = signal<number>(0);
  public activePlayingVoiceId = signal<string | null>(null);

  private recordingInterval: any = null;
  private shouldScrollToBottom: boolean = true;

  public messages = computed(() => {
    return this.chatService.getMessagesForJob(this.jobId);
  });

  public quickPresets = computed(() => {
    return this.currentUserRole === 'customer'
      ? this.chatService.customerPresets
      : this.chatService.workerPresets;
  });

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  public scrollToBottom(): void {
    try {
      if (this.messagesScrollContainer) {
        this.messagesScrollContainer.nativeElement.scrollTop = this.messagesScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  public sendMessage(): void {
    const text = this.inputText().trim();
    if (!text) return;

    this.chatService.sendMessage(
      this.jobId,
      this.currentUserId,
      this.currentUserName,
      this.currentUserRole,
      text
    );

    this.inputText.set('');
    this.shouldScrollToBottom = true;
  }

  public sendPreset(presetText: string): void {
    this.chatService.sendMessage(
      this.jobId,
      this.currentUserId,
      this.currentUserName,
      this.currentUserRole,
      presetText
    );
    this.shouldScrollToBottom = true;
  }

  public startVoiceRecording(): void {
    this.isRecordingVoice.set(true);
    this.recordingSeconds.set(0);
    this.recordingInterval = setInterval(() => {
      this.recordingSeconds.update(s => s + 1);
    }, 1000);
  }

  public finishVoiceRecording(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }

    const duration = Math.max(3, this.recordingSeconds());
    this.isRecordingVoice.set(false);

    this.chatService.sendVoiceNote(
      this.jobId,
      this.currentUserId,
      this.currentUserName,
      this.currentUserRole,
      duration
    );

    this.shouldScrollToBottom = true;
  }

  public cancelVoiceRecording(): void {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    this.isRecordingVoice.set(false);
    this.recordingSeconds.set(0);
  }

  public togglePlayVoice(msgId: string): void {
    if (this.activePlayingVoiceId() === msgId) {
      this.activePlayingVoiceId.set(null);
    } else {
      this.activePlayingVoiceId.set(msgId);
      // Auto pause after 5 seconds simulation
      setTimeout(() => {
        if (this.activePlayingVoiceId() === msgId) {
          this.activePlayingVoiceId.set(null);
        }
      }, 5000);
    }
  }

  public onClose(): void {
    this.closeChat.emit();
  }
}
