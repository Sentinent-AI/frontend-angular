import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'sentinent_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token || req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
