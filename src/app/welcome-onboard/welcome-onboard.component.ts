import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '@services/api.service';
import { users } from 'src/environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserService } from '@services/user.service';
import { Auth0Service } from '@services/auth0.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '@services/local.storage';
import { LoaderService } from '@services/loader.service';
import { IAdministrator, ICurrentUser } from '@shared/types/user.interface';
import { AgencyDetail } from '@shared/types/agency.interface';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-welcome-onboard',
  templateUrl: './welcome-onboard.component.html',
  styleUrls: ['./welcome-onboard.component.scss']
})
export class WelcomeOnboardComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  public userInfo: ICurrentUser;
  public adminInfoList: IAdministrator[];
  public isAdministatorHighlight: boolean = false;
  public avtOfAgency: string;

  constructor(
    public userService: UserService,
    private apiService: ApiService,
    private auth0Service: Auth0Service,
    private storage: LocalStorageService,
    private router: Router,
    private loaderService: LoaderService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadingService.onLoading();

    this.apiService
      .getAPI(users, 'current-user')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.userInfo = res;
          this.avtOfAgency = this.getAvtOfAgency(this.userInfo.firstName);
          this.checkAgentHasPods();
          this.loadingService.stopLoading();
        }
      });

    this.userService
      .getAdministratorInfo()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: IAdministrator[]) => (this.adminInfoList = res));
  }
  checkAgentHasPods() {
    this.apiService
      .getAPI(users, 'v2/agent-details')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: AgencyDetail) => {
        if (res.podIds && res.podIds.length) {
          this.router.navigate([`dashboard`]);
        }
      });
  }

  sendEmail(email: string): void {
    window.open(
      `https://mail.google.com/mail/u/0/?fs=1&to=${email}&tf=cm`,
      '_blank'
    );
  }

  borderOn() {
    this.isAdministatorHighlight = true;
  }

  borderOff() {
    this.isAdministatorHighlight = false;
  }

  getAvtOfAgency(name: string) {
    if (!name || !name.length) {
      return '';
    }
    return name.charAt(0);
  }

  onLogOut() {
    this.auth0Service
      .logout()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.router.navigate(['']);
        this.storage.clearLocalStorage();
      });
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
