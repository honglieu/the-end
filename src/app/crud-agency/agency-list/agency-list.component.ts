import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CrudAgency } from '@shared/types/agency.interface';
import { AgencyService } from '@services/agency.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';

@Component({
  selector: 'app-agency-list',
  templateUrl: './agency-list.component.html',
  styleUrls: ['./agency-list.component.scss']
})
export class AgencyListComponent implements OnInit {
  @Output() indexAgency = new EventEmitter<number>();

  public agencies!: CrudAgency[];
  public isShowAgencyForm = false;
  public popupModalPosition = ModalPopupPosition;
  public agencyIndex: number = 0;

  constructor(private agencyService: AgencyService) {}

  ngOnInit(): void {
    this.agencyService.getListCrudAgencies();
    this.agencyService.agenciesCrudList.subscribe((data) => {
      this.agencies = data;
    });
  }

  createAgency() {
    this.isShowAgencyForm = true;
  }

  isHideAgencyForm(status: boolean) {
    this.isShowAgencyForm = status;
  }

  changeAgency(i: number) {
    this.indexAgency.emit(i);
    this.agencyIndex = i;
  }
}
