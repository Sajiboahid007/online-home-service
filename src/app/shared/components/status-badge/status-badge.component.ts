import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() label: string = '';
  @Input() icon?: string;

  get badgeClass(): string {
    switch (this.status) {
      case 'completed':
      case 'approved':
      case 'active':
      case 'online':
        return 'badge-success';
      case 'in_progress':
      case 'on_the_way':
      case 'arrived':
      case 'searching':
        return 'badge-info';
      case 'pending':
      case 'busy':
      case 'warned':
        return 'badge-warning';
      case 'cancelled':
      case 'rejected':
      case 'banned':
      case 'suspended':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  }
}
