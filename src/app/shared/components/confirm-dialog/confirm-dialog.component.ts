import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  @Input() title: string = 'নিশ্চিত করুন';
  @Input() message: string = 'আপনি কি এই কাজটি সম্পাদন করতে চান?';
  @Input() confirmText: string = 'হ্যাঁ, নিশ্চিত';
  @Input() cancelText: string = 'বাতিল';
  @Input() type: 'danger' | 'info' | 'warning' = 'info';

  public visible = signal<boolean>(false);

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  public show(): void {
    this.visible.set(true);
  }

  public hide(): void {
    this.visible.set(false);
  }

  public onConfirm(): void {
    this.visible.set(false);
    this.confirmed.emit();
  }

  public onCancel(): void {
    this.visible.set(false);
    this.cancelled.emit();
  }
}
