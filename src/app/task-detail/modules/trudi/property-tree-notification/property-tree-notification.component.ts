import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'property-tree-notification',
  templateUrl: './property-tree-notification.component.html',
  styleUrls: ['./property-tree-notification.component.scss']
})
export class PropertyTreeNotificationComponent implements OnInit {
  @Input() title: string;
  @Input() note: string;
  constructor() {}

  ngOnInit(): void {}
}
