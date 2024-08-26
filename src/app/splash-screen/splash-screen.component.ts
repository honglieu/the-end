import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-splash-screen',
  template: `
    <div class="splash-screen">
      <ng-lottie width="100%" height="100vh" [options]="options"></ng-lottie>
    </div>
  `,
  styles: [
    `
      .splash-screen {
        position: fixed;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        z-index: 9999;
        background-color: #fff;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SplashScreenComponent {
  public options: AnimationOptions = {
    path: '/assets/animations/splash-screen.json'
  };
}
