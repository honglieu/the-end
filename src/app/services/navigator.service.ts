import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigatorService {
  private returnUrlBS = new BehaviorSubject(null);
  constructor(private router: Router) {}

  public setReturnUrl(url: string) {
    this.returnUrlBS.next(url);
  }

  public getReturnUrl(): string {
    return this.returnUrlBS.value;
  }

  public back(commands = ['dashboard']) {
    if (this.returnUrlBS.value) {
      this.router.navigateByUrl(this.returnUrlBS.value, {
        replaceUrl: true
      });
      this.setReturnUrl(null);
    } else {
      this.router.navigate(commands);
    }
  }
}
