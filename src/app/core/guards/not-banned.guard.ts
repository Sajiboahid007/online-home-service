import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const notBannedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  if (user && (user.status === 'banned' || user.status === 'suspended')) {
    alert(`অ্যাকাউন্ট স্ট্যাটাস: ${user.status === 'banned' ? 'স্থায়ীভাবে নিষিদ্ধ' : 'সাময়িক বরখাস্ত'}। কারণ: ${user.banReason || 'কর্তৃপক্ষের সিদ্ধান্ত'}`);
    return router.createUrlTree(['/login']);
  }

  return true;
};
