import { Component, Input, OnInit } from '@angular/core';
import { IPersonalInTab } from '@shared/types/user.interface';
import { SharedService } from '@services/shared.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { ECrmSystemId } from '@/app/dashboard/modules/task-editor/constants/task-template.constants';

@Component({
  selector: 'card-info-people',
  templateUrl: './card-info-people.component.html',
  styleUrls: ['./card-info-people.component.scss']
})
export class CardInfoPeopleComponent implements OnInit {
  @Input() listOfUser: IPersonalInTab;
  @Input() skeletonListCount = 2;
  @Input() isLoading = false;
  @Input() crmSystemId = '';
  public readonly EUserPropertyType = EUserPropertyType;
  public readonly ECrmSystemId = ECrmSystemId;
  constructor(
    private sharedService: SharedService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  get isRMSystem() {
    return this.crmSystemId === ECrmSystemId.RENT_MANAGER;
  }
  ngOnInit(): void {}
}
