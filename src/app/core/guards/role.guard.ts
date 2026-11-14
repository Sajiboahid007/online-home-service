import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;
  const currentRole = auth.currentRole();

  if (!allowedRoles || (currentRole && allowedRoles.includes(currentRole))) {
    return true;
  }

  // Redirect to appropriate landing depending on role
  if (currentRole === 'superadmin' || currentRole === 'admin') {
    return router.createUrlTree(['/admin']);
  } else if (currentRole === 'worker') {
    return router.createUrlTree(['/worker']);
  } else {
    return router.createUrlTree(['/customer/home']);
  }
};
