import { Component, OnInit } from '@angular/core';
import { Auth0Service } from '@services/auth0.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  constructor(private auth0Service: Auth0Service) {}

  ngOnInit() {
    this.auth0Service.login();
    setTimeout(() => {
      window.loader.ajaxindicatorstop();
    }, 500);
  }
}
