import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {
  showBanner: boolean = false;

  constructor() {}
  ngOnInit() {}

  handleOnloadBanner() {
    this.showBanner = true;
  }
}
