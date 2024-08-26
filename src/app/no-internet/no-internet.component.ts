import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'no-internet',
  templateUrl: './no-internet.component.html',
  styleUrls: ['./no-internet.component.scss']
})
export class NoInternetComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  refreshApp() {
    if (navigator.onLine) {
      window.location.href = '/';
    } else {
      this.router.navigate(['/']);
    }
  }
}
