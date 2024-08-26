import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'event-name',
  templateUrl: './event-name.component.html',
  styleUrls: ['./event-name.component.scss']
})
export class EventNameComponent implements OnInit {
  @Input() name = '';
  @Input() isOverDeal = false;

  constructor() {}

  ngOnInit(): void {}
}
