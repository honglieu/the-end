import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {
  @Input() progress = 0;
  @Input() isSyncFlow = false;
  @Input() isSyncFail = false;
  constructor() {}

  ngOnInit() {}
}
