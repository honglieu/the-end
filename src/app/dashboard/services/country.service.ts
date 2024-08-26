import { Injectable } from '@angular/core';
import { AgencyService } from './agency.service';
import { distinctUntilChanged, map } from 'rxjs';
import { ECountryName } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { EPropertyByCountry } from '@/app/dashboard/modules/insights/enums/insights.enum';
import { CompanyService } from '@services/company.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  constructor(
    private agencyService: AgencyService,
    private companyService: CompanyService
  ) {}
  public readonly LIST_COUNTRY_BY_CRMSYSTEM = [
    {
      PROPERTY_TREE: ECountryName.AUSTRALIA,
      PROPERTY_TEXT_BY_COUNTRY: EPropertyByCountry.AU_PROPERTY
    },
    {
      RENT_MANAGER: ECountryName.UNITED_STATES,
      PROPERTY_TEXT_BY_COUNTRY: EPropertyByCountry.US_PROPERTY
    }
  ];
  public currentInformationCountry$ = this.companyService
    .getCurrentCompany()
    .pipe(
      map((company) => company?.crmSystem),
      distinctUntilChanged(),
      map((crmSystem) => {
        const countryByCrmSystem = this.LIST_COUNTRY_BY_CRMSYSTEM.find(
          (countryByCrmSystem) => countryByCrmSystem[crmSystem]
        );
        return {
          propertyTextByCountry: countryByCrmSystem.PROPERTY_TEXT_BY_COUNTRY,
          countryName: countryByCrmSystem[crmSystem]
        };
      })
    );
}
