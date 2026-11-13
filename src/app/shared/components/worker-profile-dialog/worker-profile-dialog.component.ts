import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerProfile } from '../../../core/models/worker.model';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';
import { BnNumberPipe } from '../../pipes/bn-number.pipe';
import { TakaPipe } from '../../pipes/taka.pipe';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-worker-profile-dialog',
  standalone: true,
  imports: [CommonModule, RatingStarsComponent, BnNumberPipe, TakaPipe],
  templateUrl: './worker-profile-dialog.component.html',
  styleUrls: ['./worker-profile-dialog.component.scss']
})
export class WorkerProfileDialogComponent {
  private auth = inject(AuthService);

  @Input() worker: WorkerProfile | null = null;
  public visible = signal<boolean>(false);
  public isFav = signal<boolean>(false);

  @Output() bookDirect = new EventEmitter<WorkerProfile>();

  public show(worker: WorkerProfile): void {
    this.worker = worker;
    this.isFav.set(this.auth.isFavoriteWorker(worker.uid));
    this.visible.set(true);
  }

  public close(): void {
    this.visible.set(false);
  }

  public toggleFav(): void {
    if (this.worker) {
      this.auth.toggleFavoriteWorker(this.worker.uid);
      this.isFav.set(this.auth.isFavoriteWorker(this.worker.uid));
    }
  }

  public onBook(): void {
    if (this.worker) {
      this.close();
      this.bookDirect.emit(this.worker);
    }
  }
}
