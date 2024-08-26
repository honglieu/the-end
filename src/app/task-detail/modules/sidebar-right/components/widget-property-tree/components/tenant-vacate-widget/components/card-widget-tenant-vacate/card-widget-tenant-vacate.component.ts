import { Component, OnInit, Input } from '@angular/core';
import { IWidgetVacate, TypeVacate } from '@/app/task-detail/utils/functions';

@Component({
  selector: 'card-widget-tenant-vacate',
  templateUrl: './card-widget-tenant-vacate.component.html',
  styleUrls: ['./card-widget-tenant-vacate.component.scss']
})
export class CardWidgetTenantVacateComponent implements OnInit {
  @Input() listWidgetTenantVacate: IWidgetVacate;

  public itemVacate: {
    tenantVacateType: string;
  };

  constructor() {}

  ngOnInit(): void {
    const { formatVacateType } = this;
    this.listWidgetTenantVacate.tenantVacateType = formatVacateType;
  }

  get formatVacateType() {
    const formatVacateType = TypeVacate.find(
      (item) => item?.value === this.listWidgetTenantVacate?.tenantVacateType
    );
    return formatVacateType?.text;
  }
}
