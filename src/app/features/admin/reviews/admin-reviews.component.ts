import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../core/services/review.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { exportToCsv } from '../../../core/utils/csv-exporter';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.scss']
})
export class AdminReviewsComponent {
  private reviewService = inject(ReviewService);
  private auditLog = inject(AuditLogService);
  private auth = inject(AuthService);

  public reviews = this.reviewService.reviews;

  public toggleHide(id: string): void {
    this.reviewService.toggleHideReview(id);
    this.auditLog.logAction({
      actorId: this.auth.currentUser()?.uid || 'admin',
      actorName: this.auth.currentUser()?.name || 'অ্যাডমিন',
      actorRole: 'admin',
      action: 'review_visibility_toggled',
      targetId: id,
      targetType: 'settings',
      reason: 'অনৈতিক বা নীতিবিরুদ্ধ পর্যালোচনার দৃশ্যমানতা পরিবর্তন'
    });
  }

  public exportCsv(): void {
    const rows = this.reviews().map(r => ({
      'Review ID': r.id,
      'From': r.fromName,
      'To UID': r.toUid,
      'Stars': r.stars,
      'Comment': r.comment,
      'Is Hidden': r.isHidden,
      'Created At': r.createdAt
    }));
    exportToCsv('KajKhoj_Reviews', rows);
  }
}
