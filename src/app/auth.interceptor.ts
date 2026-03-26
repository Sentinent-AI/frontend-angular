import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'sentinent_token';

const THIRD_PARTY_HOSTS = ['slack.com', 'api.github.com', 'github.com'];

function isThirdPartyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return THIRD_PARTY_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token || isThirdPartyUrl(req.url)) {
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
