import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const workerOnboardingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const worker = auth.currentWorker();

  // If worker hasn't set up mandatory homeLocation or category, redirect to registration stepper
  if (worker && (!worker.homeLocation || !worker.homeLocation.lat || !worker.homeLocation.lng)) {
    return router.createUrlTree(['/auth/register-worker']);
  }

  return true;
};
