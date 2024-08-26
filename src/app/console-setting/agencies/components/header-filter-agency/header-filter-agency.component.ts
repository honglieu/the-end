import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { IItemConsoleFilter } from '@/app/console-setting/agencies/utils/console.type';
import { EConsoleFilterTypes } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { CompanyConsoleSettingService } from '@/app/console-setting/agencies/services/company-console-setting.service';
import { ESelectFilter } from '@shared/enum/selectFilter.enum';

@Component({
  selector: 'header-filter-agency',
  templateUrl: './header-filter-agency.component.html',
  styleUrls: ['./header-filter-agency.component.scss']
})
export class HeaderFilterAgencyComponent implements OnInit {
  public crmStatus: Array<IItemConsoleFilter>;
  public featuresList: Array<IItemConsoleFilter>;
  public filterType = EConsoleFilterTypes;
  public selectedAgency: string;
  public formDropdown: string = ESelectFilter.SINGLE_SELECTION;
  @Output() selectedEventFilter = new EventEmitter<void>();

  constructor(
    private companyConsoleSettingService: CompanyConsoleSettingService
  ) {}

  ngOnInit(): void {
    this.getFilterResources();
  }

  handleItemsSelected(event) {
    this.selectedEventFilter.emit(event);
  }

  getFilterResources(): void {
    this.companyConsoleSettingService.getAgencyResources().subscribe((res) => {
      this.crmStatus = res.crmSystems;
      this.featuresList = res.features;
    });
  }
}
