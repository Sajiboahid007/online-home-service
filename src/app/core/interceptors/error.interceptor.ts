import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'একটি অপ্রত্যাশিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      if (error.error instanceof ErrorEvent) {
        // Client-side network or script error
        errorMessage = `ত্রুটি: ${error.error.message}`;
      } else {
        // Backend / server-side returned an unsuccessful status code
        errorMessage = `সার্ভার রেসপন্স কোড ${error.status}: ${error.message}`;
      }
      console.error('KajKhoj API Error:', errorMessage, error);
      return throwError(() => new Error(errorMessage));
    })
  );
};
