import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationCenterComponent } from '../../../shared/components/notification-center/notification-center.component';
import { LangToggleComponent } from '../../../shared/components/lang-toggle/lang-toggle.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationCenterComponent, LangToggleComponent, TranslatePipe],
  templateUrl: './superadmin-layout.component.html',
  styleUrls: ['./superadmin-layout.component.scss']
})
export class SuperadminLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  public logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
