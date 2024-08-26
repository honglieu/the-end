import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'warning-property',
  templateUrl: './warning-property.component.html',
  styleUrls: ['./warning-property.component.scss']
})
export class WarningPropertyComponent implements OnInit {
  @Input() msgContent: string;
  constructor() {}

  ngOnInit(): void {}
}
