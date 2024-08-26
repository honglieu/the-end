import { FacebookSDK } from '@/app/dashboard/shared/types/facebook-account.interface';
import { configFacebookApplication } from '@/environments/environment';

declare const FB: FacebookSDK;

export function appFacebookInitializer() {
  return () =>
    new Promise((resolve) => {
      // wait for facebook sdk to initialize before starting the angular app
      window['fbAsyncInit'] = function () {
        FB.init({
          appId: configFacebookApplication.APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        });

        resolve(null);
      };

      // load facebook sdk script
      (function (d, s, id) {
        var js: any;
        var fjs: any = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'facebook-jssdk');
    });
}
