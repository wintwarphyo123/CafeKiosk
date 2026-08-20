// 
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from '../cores/services/user';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userService = inject(UserService);
  const router = inject(Router);

  // STEP 1 — Skip attaching token to the refresh endpoint itself
  //          (avoids infinite loop if refresh also gets a 401)
  const isRefreshCall = req.url.includes('/api/auth/refresh');
  const isLoginCall   = req.url.includes('/api/auth/login');

  const token = userService.getAccessToken();

  // STEP 2 — Attach token to all requests (except login/refresh)
  const authReq =
    token && !isRefreshCall && !isLoginCall
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      // STEP 3 — 401 on a normal request → try to refresh
      if (error.status === 401 && !isRefreshCall && !isLoginCall) {

        return userService.refresh().pipe(
          switchMap((res) => {
            // STEP 4 — Got new tokens → retry the original request
            const newToken = userService.getAccessToken();
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(retryReq);
          }),

          catchError((refreshError) => {
            // STEP 5 — Refresh also failed → force logout
            userService.clearTokens();
            userService.currentUserProfile.set(null);
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};