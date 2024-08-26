import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import en from '@angular/common/locales/en';
import {
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
  ErrorHandler,
  Injector,
  NgModule,
  isDevMode
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgSelectModule } from '@ng-select/ng-select';
import * as Sentry from '@sentry/angular-ivy';
import {
  GoogleLoginProvider,
  SocialAuthServiceConfig,
  SocialLoginModule
} from '@abacritt/angularx-social-login';

import 'dayjs/locale/en';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import updateLocale from 'dayjs/plugin/updateLocale';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { IConfig, provideEnvironmentNgxMask } from 'ngx-mask';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from '@/app/app-routing.module';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { AngularFireModule } from '@angular/fire/compat';
import { firebaseConfig } from 'src/environments/environment';
import { AppComponent } from './app.component';
import { CallingComponent } from './calling/calling.component';
import { VoiceCallingComponent } from './calling/voice-call/voice-calling.component';
import { CheckLogin } from './check.login';
import { CheckRole } from './check.role';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { HeaderModule } from './header/header.module';
import { InternetDisconnectComponent } from './internet-disconnect/internet-disconnect.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main';
import { NoInternetComponent } from './no-internet/no-internet.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { OverlayComponentModule } from './overlay/overlay.module';
import { getErrorHandler } from './sentry';
import { Auth0Service } from './services/auth0.service';
import { FirebaseService } from './services/firebase.service';
import { MessageService } from './services/message.service';
import { ShowPanelService } from './services/showPanel.service';
import { UserService } from './services/user.service';
import { SharePopUpModule } from './share-pop-up/share-pop-up.module';
import { DndDirective } from './shared/components/add-files-pop-up/dnd.directive';
import { SharedModule } from './shared/shared.module';
import { ToastComponent } from './toast/toast.component';
import { TrudiScheduledMsgModule } from './trudi-scheduled-msg/trudi-scheduled-msg.module';
import { TrudiSendMsgModule } from './trudi-send-msg/trudi-send-msg.module';

import { map, Observable, tap } from 'rxjs';
import { ToastCustomComponent } from './toast-custom/toast-custom.component';
import { TrudiStoreModule } from './core/store';
import { TrudiIndexedDBModule } from './core/storage';
import { LottieModule } from 'ngx-lottie';
import lottiePlayer from 'lottie-web';
import { SplashScreenModule } from './splash-screen/splash-screen.module';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { UserTypeInPTPipe } from './shared/pipes/user-type-in-pt.pipe';
import { ServiceWorkerModule } from '@angular/service-worker';
import { appFacebookInitializer } from '@/helpers/facebook/app-facebook.initializer';
import { AgencyService } from './dashboard/services/agency.service';
import { CompanyService } from './services';
import { PreventButtonModule, TrudiUiModule } from '@trudi-ui';
import { MediaLinkComponent } from '@/app/media-link/media-link.component';
import { AgencyDateFormatService } from './dashboard/services/agency-date-format.service';
import { ModalManagementService } from './dashboard/services/modal-management.service';

dayjs.extend(isLeapYear);
dayjs.extend(duration);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(updateLocale);
dayjs.locale('en');
dayjs.updateLocale('en', {
  weekStart: 1
});
dayjs.extend(quarterOfYear);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

registerLocaleData(en);

export function initializeApp(
  auth0Service: Auth0Service,
  userService: UserService
) {
  return () =>
    userService
      .setCurrentUser()
      .pipe(tap((data) => data == 'timeout' && auth0Service?.handleLogout()));
}

export function isRmCrmFactory(injector: Injector): Observable<boolean> {
  const companyService = injector.get(CompanyService);
  const agencyService = injector.get(AgencyService);
  return companyService
    .getCurrentCompany()
    .pipe(map((company) => agencyService.isRentManagerCRM(company)));
}

function trudiDateFormatFactory(injector: Injector) {
  const agencyDateFormatService = injector.get(AgencyDateFormatService);
  return agencyDateFormatService;
}

function trudiModalManagerFactory(injector: Injector) {
  const modalManagementService = injector.get(ModalManagementService);
  return modalManagementService;
}

const maskConfig: Partial<IConfig> = {
  validation: false
};

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    LoginComponent,
    CallingComponent,
    VoiceCallingComponent,
    DndDirective,
    InternetDisconnectComponent,
    NoInternetComponent,
    ToastComponent,
    NotFoundComponent,
    ToastCustomComponent,
    MediaLinkComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    SocialLoginModule,
    ReactiveFormsModule,
    SharedModule,
    OverlayComponentModule,
    NgSelectModule,
    DragDropModule,
    NgOptionHighlightModule,
    OverlayModule,
    ToastrModule.forRoot({
      toastComponent: ToastComponent,
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      toastClass: 'toast-custom',
      closeButton: true,
      extendedTimeOut: 3000
    }),
    HeaderModule,
    SharePopUpModule,
    TrudiUiModule.forRoot({
      isRmCrmFactory,
      trudiDateFormatFactory,
      trudiModalManagerFactory
    }),
    TrudiSendMsgModule,
    TrudiScheduledMsgModule,
    TrudiStoreModule,
    TrudiIndexedDBModule,
    LottieModule.forRoot({ player: () => lottiePlayer }),
    SplashScreenModule,
    PreventButtonModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 3 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:3000'
    }),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireMessagingModule
  ],
  providers: [
    UserTypeInPTPipe,
    {
      provide: ErrorHandler,
      useFactory: getErrorHandler
    },
    {
      provide: Sentry.TraceService,
      deps: [Router]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appFacebookInitializer,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [Auth0Service, UserService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth0: Auth0Service) => async () => {
        const queryString = location.hash.slice(1);
        const queryParams = new URLSearchParams(queryString);
        if (queryParams.get('id_token') && queryParams.get('state')) {
          return await auth0.handleAuthentication();
        }
        return true;
      },
      deps: [Auth0Service],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth0: Auth0Service) => async () => {
        return await auth0.referenceTokenIfNeed();
      },
      deps: [Auth0Service],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      // services must init before app
      deps: [NgxIndexedDBService, Sentry.TraceService],
      multi: true
    },
    CheckLogin,
    DatePipe,
    CheckRole,
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '96737422545-iccb5u3hifehevui1s82214qm1d71378.apps.googleusercontent.com'
            )
          }
        ],
        onError: (err: unknown) => {
          console.error(err);
        }
      } as SocialAuthServiceConfig
    },
    MessageService,
    ShowPanelService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    FirebaseService,
    { provide: NZ_I18N, useValue: en_US },
    provideEnvironmentNgxMask(maskConfig)
  ],
  exports: [],
  bootstrap: [MainComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
