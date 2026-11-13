import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() icon: string = 'pi-inbox';
  @Input() title: string = 'কোনো তথ্য নেই';
  @Input() description: string = 'এই মুহূর্তে কোনো রেকর্ড পাওয়া যায়নি।';
  @Input() actionLabel?: string;

  @Output() actionClick = new EventEmitter<void>();
}
