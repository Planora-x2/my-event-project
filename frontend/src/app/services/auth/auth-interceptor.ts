import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  
  // Skip adding auth header for login/register endpoints
  const isAuthEndpoint = req.url.includes('/api/auth/login/') || 
                         req.url.includes('/api/auth/registration/') ||
                         req.url.includes('/api/auth/token/');

  console.log(`[Interceptor] ${req.method} ${req.url} | token=${!!token} | authEndpoint=${isAuthEndpoint}`);

  if (token && !isAuthEndpoint) {
    const authReq = req.clone({
      setHeaders: { Authorization: `JWT ${token}` }
    });
    console.log('[Interceptor] Adding JWT header');
    return next(authReq);
  }
  return next(req);
};
