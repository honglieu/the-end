import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import './utils/extend';

if (environment.production) {
  enableProdMode();
}

if (environment.disableLog) {
  console.log = function (): void {};
  console.debug = function (): void {};
  console.warn = function (): void {};
  console.info = function (): void {};
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((error) => console.error('Platform Browser Dynamic Error', error));
