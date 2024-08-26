import { NgModule } from '@angular/core';
import { SplashScreenComponent } from './splash-screen.component';
import { LottieModule } from 'ngx-lottie';

@NgModule({
  declarations: [SplashScreenComponent],
  imports: [LottieModule],
  exports: [SplashScreenComponent],
  providers: []
})
export class SplashScreenModule {}
