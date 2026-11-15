import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-viewport" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-bubble" [ngClass]="toast.type">
          <div class="toast-icon">
            @if (toast.type === 'success') {
              <span>✓</span>
            } @else if (toast.type === 'error') {
              <span>✕</span>
            } @else if (toast.type === 'warn') {
              <span>⚠️</span>
            } @else {
              <span>ℹ️</span>
            }
          </div>
          <div class="toast-body">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-msg">{{ toast.message }}</div>
          </div>
          <button type="button" class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Close">
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-viewport {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      width: calc(100% - 40px);
      pointer-events: none;
    }

    .toast-bubble {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border-left: 5px solid #0ea5e9;
      color: #0f172a;
      animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.2s ease;

      &.success {
        border-left-color: #10b981;
        .toast-icon span {
          background: #d1fae5;
          color: #065f46;
        }
      }

      &.error {
        border-left-color: #ef4444;
        .toast-icon span {
          background: #fee2e2;
          color: #991b1b;
        }
      }

      &.warn {
        border-left-color: #f59e0b;
        .toast-icon span {
          background: #fef3c7;
          color: #92400e;
        }
      }

      &.info {
        border-left-color: #0ea5e9;
        .toast-icon span {
          background: #e0f2fe;
          color: #075985;
        }
      }

      .toast-icon span {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        flex-shrink: 0;
      }

      .toast-body {
        flex: 1;
        min-width: 0;

        .toast-title {
          font-weight: 700;
          font-size: 13.5px;
          margin-bottom: 2px;
          color: #0f172a;
        }

        .toast-msg {
          font-size: 13px;
          line-height: 1.4;
          color: #334155;
          word-break: break-word;
        }
      }

      .toast-close {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 14px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        line-height: 1;
        flex-shrink: 0;

        &:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
      }
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateY(-16px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToastContainerComponent {
  public toastService = inject(ToastService);
}
