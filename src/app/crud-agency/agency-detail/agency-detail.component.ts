import { Component, Input, OnInit } from '@angular/core';
import { CrudAgency } from '@shared/types/agency.interface';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { CompanyFormService } from '@/app/crud-agency/agency-form.service';

@Component({
  selector: 'app-agency-detail',
  templateUrl: './agency-detail.component.html',
  styleUrls: ['./agency-detail.component.scss']
})
export class AgencyDetailComponent implements OnInit {
  @Input() agency: CrudAgency;

  public isShowAgencyForm = false;
  public popupModalPosition = ModalPopupPosition;
  public title: string = '';

  constructor(private companyFormService: CompanyFormService) {}

  ngOnInit(): void {}

  isHideAgencyForm(status: boolean) {
    this.isShowAgencyForm = status;
  }

  editAgency() {
    this.isShowAgencyForm = true;
    this.companyFormService.setCompanyForm(this.agency);
    this.title = this.agency.companyName;
  }
}
