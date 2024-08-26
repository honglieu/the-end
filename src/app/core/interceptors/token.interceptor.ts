import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Auth0Service } from '@/app/services/auth0.service';
import {
  apiKey,
  aiApiEndpoint,
  currentVersion
} from 'src/environments/environment';
import { Observable } from 'rxjs';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from '@services/company.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private apiKey: string = apiKey;
  private aiApiEndpoint: string = aiApiEndpoint;
  constructor(
    private auth0Service: Auth0Service,
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}

  public intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token: string | null = this.auth0Service.getAccessToken();

    const containsApiKey = (url: string, key: string) => url.includes(key);
    const allowedApiKeys = [this.apiKey, this.aiApiEndpoint];

    if (token && allowedApiKeys.some((key) => containsApiKey(req.url, key))) {
      let body;
      if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else {
        body = req.body;
      }
      const agencyId = req.params.get('agencyId') || body?.agencyId || '';
      const companyId =
        req.params.get('companyId') ||
        body?.companyId ||
        this.companyService.currentCompanyId() ||
        localStorage.getItem('companyId') ||
        '';

      req = req.clone({
        setHeaders: {
          Authorization: 'Bearer ' + token,
          'current-version': currentVersion,
          'client-type': 'console',
          'agency-id': agencyId,
          'company-id': companyId,
          'version-hash': '{COMMIT_HASH}',
          'version-time': '{BUILD_DATE}'
        }
      });
    }

    return next.handle(req);
  }
}
