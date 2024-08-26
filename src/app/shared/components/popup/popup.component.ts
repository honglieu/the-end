import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-popup',
  templateUrl: 'popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {
  @Input() popupTitleText: string;
  @Input() popupBodyText: string;
  @Input() popupButtonText: string;

  constructor() {}

  ngOnInit() {}

  refreshPage() {
    window.location.reload();
  }
}
