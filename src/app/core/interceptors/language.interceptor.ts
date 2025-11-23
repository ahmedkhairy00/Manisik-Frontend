import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(I18nService);
  const lang = i18n.getCurrentLanguage();

  const clonedReq = req.clone({
    setHeaders: {
      'Accept-Language': lang
    }
  });

  return next(clonedReq);
};
