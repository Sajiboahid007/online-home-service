import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BnNumberPipe } from '../../pipes/bn-number.pipe';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule, BnNumberPipe],
  templateUrl: './rating-stars.component.html',
  styleUrl: './rating-stars.component.scss'
})
export class RatingStarsComponent {
  @Input() rating: number = 5;
  @Input() count?: number;
  @Input() showValue: boolean = true;

  public stars = [1, 2, 3, 4, 5];

  public isHalf(star: number): boolean {
    return this.rating > star - 1 && this.rating < star;
  }
}
