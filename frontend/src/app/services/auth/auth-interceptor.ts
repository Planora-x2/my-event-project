import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Always send cookies (JWTs) with requests
  let clonedReq = req.clone({
    withCredentials: true
  });

  // Extract CSRF token from cookies if present
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    clonedReq = clonedReq.clone({
      setHeaders: { 'X-XSRF-TOKEN': csrfToken }
    });
  }

  return next(clonedReq);
};
