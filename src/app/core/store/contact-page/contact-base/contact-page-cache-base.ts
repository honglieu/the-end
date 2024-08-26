import { CompanyService } from '@services/company.service';
import { first } from 'rxjs';
import { TrudiEffect } from '@core/store/shared/trudi-effect';

export class ContactPageCacheBase extends TrudiEffect {
  constructor(protected companyService: CompanyService) {
    super();
  }
  public composeCacheKey(payload, companyId) {
    const token = `${JSON.stringify(payload)}-${companyId}`;
    return token;
  }

  public getCurrentCompanyId() {
    return this.companyService.getCurrentCompanyId().pipe(first(Boolean));
  }
}
