import { Component, OnInit } from '@angular/core';
import { WidgetType } from '@shared/enum/widget.enum';

@Component({
  selector: 'widget-calls',
  templateUrl: './widget-calls.component.html',
  styleUrls: ['./widget-calls.component.scss']
})
export class WidgetCallsComponent implements OnInit {
  widgetType = WidgetType;
  public paragraph: object = { rows: 0 };
  public isLoading: boolean = false;
  public isStopAudio: boolean;
  public itemsCounts = 0;

  constructor() {}

  ngOnInit(): void {}

  onLoadingFilePanel(value: boolean) {
    this.isLoading = value;
  }

  onActiveChange(event) {
    this.isStopAudio = event;
  }
}
