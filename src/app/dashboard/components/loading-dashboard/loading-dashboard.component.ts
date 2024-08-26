import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'loading-dashboard',
  templateUrl: './loading-dashboard.component.html',
  styleUrls: ['./loading-dashboard.component.scss']
})
export class LoadingDashboardComponent implements OnInit {
  public paragraph: object = { rows: 0 };

  constructor() {}
  ngOnInit(): void {}
}
