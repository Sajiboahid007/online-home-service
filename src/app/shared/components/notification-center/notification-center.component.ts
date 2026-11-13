import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, TimeAgoPipe],
  templateUrl: './notification-center.component.html',
  styleUrls: ['./notification-center.component.scss']
})
export class NotificationCenterComponent {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  public notifications = this.notificationService.notifications;
  public unreadCount = this.notificationService.unreadCount;
  public isOpen = signal<boolean>(false);

  public toggleOpen(): void {
    this.isOpen.update(v => !v);
  }

  public close(): void {
    this.isOpen.set(false);
  }

  public onItemClick(item: AppNotification): void {
    this.notificationService.markAsRead(item.id);
    if (item.link) {
      this.close();
      this.router.navigateByUrl(item.link);
    }
  }

  public markAllRead(): void {
    this.notificationService.markAllAsRead();
  }

  public clearAll(): void {
    this.notificationService.clearAll();
  }
}
