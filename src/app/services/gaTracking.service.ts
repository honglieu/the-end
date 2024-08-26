import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { gaTrackingId } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleAnalyticsService {
  constructor(private _router: Router) {
    this._router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        if (window.gtag) {
          window.gtag('js', new Date());
          window.gtag('config', gaTrackingId, {
            page_path: e.urlAfterRedirects
          });
        }
      });
  }

  private appendToHead(element: HTMLElement): void {
    const headElement = document.head;
    if (headElement) {
      headElement.appendChild(element);
    }
  }

  private appendToBody(element: HTMLElement): void {
    const bodyElement = document.querySelector('body');
    if (bodyElement) {
      bodyElement.appendChild(element);
    }
  }

  init(): void {
    const scriptCode = `(function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
      var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', '${gaTrackingId}');`;

    const headScript = document.createElement('script');
    headScript.innerHTML = scriptCode;
    this.appendToHead(headScript);

    const iframeCode = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gaTrackingId}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe>`;

    const noscriptElement = document.createElement('noscript');
    noscriptElement.innerHTML = iframeCode;
    this.appendToBody(noscriptElement);
  }
}
