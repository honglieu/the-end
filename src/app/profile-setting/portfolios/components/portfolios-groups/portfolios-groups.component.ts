import { Component, Input, OnInit } from '@angular/core';
import { IPortfoliosGroups } from '@/app/profile-setting/portfolios/interfaces/portfolios.interface';
import { Portfolio } from '@shared/types/user.interface';

@Component({
  selector: 'portfolios-groups',
  templateUrl: './portfolios-groups.component.html',
  styleUrls: ['./portfolios-groups.component.scss']
})
export class PortfoliosGroupsComponent implements OnInit {
  constructor() {}
  @Input() portfoliosGroup: IPortfoliosGroups;

  ngOnInit(): void {}

  portfoliosTrackBy(_, portfolios: Portfolio) {
    return portfolios.id;
  }
}
