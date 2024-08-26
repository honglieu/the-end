import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { USER_PROPERTY_TYPE } from '@/app/user/list-property-contact-view/model/main';
import { ERentPropertyStatus } from '@/app/user/utils/user.enum';

@Component({
  selector: 'tenancy-ownership-item',
  templateUrl: './tenancy-ownership-item.component.html',
  styleUrls: ['./tenancy-ownership-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TenantOwnerItemComponent implements OnInit {
  @Input() item: any;
  @Input() searchValue: string;
  public userPropertyType = USER_PROPERTY_TYPE;
  public ERentPropertyStatus = ERentPropertyStatus;
  constructor() {}

  ngOnInit(): void {}
}
