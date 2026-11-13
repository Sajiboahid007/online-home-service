import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss']
})
export class ImageUploaderComponent {
  @Input() label: string = 'ছবি আপলোড করুন';
  @Input() acceptedTypes: string = 'image/jpeg,image/png,image/webp';
  @Input() maxSizeBytes: number = 5 * 1024 * 1024; // 5 MB

  @Output() imageSelected = new EventEmitter<string>();
  @Output() imageCleared = new EventEmitter<void>();

  public previewUrl = signal<string | null>(null);
  public isDragging = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    this.errorMessage.set(null);

    // Validate size
    if (file.size > this.maxSizeBytes) {
      this.errorMessage.set('ছবির সাইজ ৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    // Validate MIME type
    const validMimes = this.acceptedTypes.split(',').map(m => m.trim());
    if (!validMimes.includes(file.type)) {
      this.errorMessage.set('শুধুমাত্র JPG, PNG বা WebP ফরম্যাটের ছবি আপলোড করা যাবে।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.previewUrl.set(result);
      this.imageSelected.emit(result);
    };
    reader.readAsDataURL(file);
  }

  public clearImage(): void {
    this.previewUrl.set(null);
    this.errorMessage.set(null);
    this.imageCleared.emit();
  }
}
