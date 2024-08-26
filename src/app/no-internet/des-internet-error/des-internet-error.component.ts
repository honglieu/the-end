import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'des-internet-error',
  templateUrl: './des-internet-error.component.html',
  styleUrls: ['./des-internet-error.component.scss']
})
export class DesInternetErrorComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  refeshApp() {
    window.location.reload();
  }
}
