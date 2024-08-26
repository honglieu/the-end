import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'chart-wrapper',
  templateUrl: './chart-wrapper.component.html',
  styleUrls: ['./chart-wrapper.component.scss']
})
export class ChartWrapperComponent implements OnInit {
  @Input() chartTitle: string;
  @Input() chartNote: string;
  constructor() {}

  ngOnInit(): void {}
}
