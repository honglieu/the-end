import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {
  EContactPageType,
  ETypeContactItem,
  IAgentUserProperties,
  IContactItemFormatted
} from '@/app/user/list-property-contact-view/model/main';
import { NO_PROPERTY } from '@services/constants';
import { ERentPropertyStatus } from '@/app/user/utils/user.enum';
import { EEntityType } from '@/app/task-detail/modules/sidebar-right/modules/widget-rent-manager/enums/widget-rent-manager.enum';
@Component({
  selector: 'property-unit-item',
  templateUrl: './property-unit-item.component.html',
  styleUrls: ['./property-unit-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyUnitItemComponent implements OnInit, OnChanges {
  @Input() environmentType: string;
  @Input() searchValue: string;
  @Input() item: IContactItemFormatted<IAgentUserProperties>;
  public EContactPageType = EContactPageType;
  public ERentPropertyStatus = ERentPropertyStatus;
  public isDisabledByStatus: boolean;
  readonly NO_PROPERTY = NO_PROPERTY;
  readonly EEntityType = EEntityType;
  readonly ETypeContactItem = ETypeContactItem;
  constructor() {}
  ngOnChanges(changes: SimpleChanges): void {
    this.isDisabledByStatus = [
      ERentPropertyStatus.DELETED,
      ERentPropertyStatus.INACTIVE,
      ERentPropertyStatus.ARCHIVED
    ].includes(this.item?.data?.status as ERentPropertyStatus);
  }

  ngOnInit(): void {}
}
