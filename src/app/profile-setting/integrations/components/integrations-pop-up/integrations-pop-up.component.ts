import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { catchError } from 'rxjs';
import { IntegrationsService } from '@/app/profile-setting/services/integrations.service';
import { ReiFormService } from '@services/rei-form.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { ReiFormOption } from '@shared/types/conversation.interface';

@Component({
  selector: 'integrations-pop-up',
  templateUrl: './integrations-pop-up.component.html',
  styleUrls: ['./integrations-pop-up.component.scss']
})
export class IntegrationsPopUpComponent implements OnInit {
  public logoForm: string = 'iconReiFormWidget';
  public formGroup: FormGroup;
  public reiFormDropdown: ReiFormOption[] = [];
  public popupModalPosition = ModalPopupPosition;

  public listProviderAccessToken = [
    {
      id: 1,
      text: 'Log into your REI Forms Live account and go to <b class="color--light-gray">Connections</b>.'
    },
    {
      id: 2,
      text: 'Create new connection and select <b class="color--light-gray">Trudi®</b>.'
    },
    { id: 3, text: 'Copy the access token provided and enter below.' }
  ];
  public stateWarningTitle = 'Are you sure you want to change the state?';

  public currentToken = '';
  public userId: string = '';
  public currentData = {
    regionId: '',
    accessToken: ''
  };
  public errorState = {
    regionId: false,
    accessToken: false
  };
  public isUpdateToken: boolean = false;
  public hasToken: boolean = false;
  public isDisabled: boolean = false;
  public isShowedPopupChangeState: boolean = false;

  get popupState() {
    return this.integrationsService.getPopupState();
  }
  constructor(
    private userService: UserService,
    private reiFormService: ReiFormService,
    private integrationsService: IntegrationsService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      reiDomain: new FormControl(null, Validators.required),
      token: new FormControl('', Validators.required)
    });
    this.initForm();
    this.getUser();
  }
  async getUser() {
    if (!this.userService.userInfo$.value) {
      this.userService.getUserInfo();
    }
    this.userService.userInfo$.subscribe((data) => {
      if (data) {
        this.userId = data.id;
      }
    });
  }

  initForm() {
    let dataActive: ReiFormOption;
    this.reiFormService.getListReiForm().subscribe((data) => {
      this.reiFormDropdown = data.sort((a, b) => a.name.localeCompare(b.name));
      dataActive = data.find((item) => item.isActive);
      if (dataActive) {
        this.currentToken = dataActive.token;
        this.currentData = {
          regionId: dataActive.regionId,
          accessToken: dataActive.token
        };
        this.isUpdateToken = true;
        this.hasToken = true;
      }
      this.formGroup.setValue({
        reiDomain: this.currentData.regionId || null,
        token: this.currentData.accessToken
      });
    });
  }

  handleSave() {
    if (this.isShowedPopupChangeState) return this.onYesPopup();
    let checkAllState = this.reiFormDropdown.some((item) => {
      return item.isActive;
    });
    if (this.getReiDomain() === this.currentData.regionId || !checkAllState) {
      return this.onYesPopup();
    }
    this.isShowedPopupChangeState = true;
    this.integrationsService.setPopupState({
      showPopupChangeState: true,
      showPopupIntegration: false
    });
  }

  handleCancel() {
    this.isShowedPopupChangeState = false;
    this.integrationsService.setPopupState({
      showPopupIntegration: false,
      showPopupChangeState: false
    });

    this.isUpdateToken = !!this.currentData.accessToken;
    this.formGroup.setValue({
      reiDomain: this.currentData.regionId || null,
      token: this.currentData.accessToken
    });
    this.errorState = {
      regionId: false,
      accessToken: false
    };
  }

  handleCancelChangeState() {
    this.isShowedPopupChangeState = false;
    this.integrationsService.setPopupState({
      showPopupIntegration: true,
      showPopupChangeState: false
    });
    this.isUpdateToken = false;
  }

  onYesPopup() {
    const dataApi = {
      regionId: this.formGroup.get('reiDomain').value,
      accessToken: this.formGroup.get('token').value,
      userId: this.userId
    };

    if (!dataApi.accessToken || !dataApi.regionId) {
      this.errorState = {
        regionId: !dataApi.regionId,
        accessToken: !dataApi.accessToken
      };
      this.isUpdateToken = false;
      this.isDisabled = false;
      this.integrationsService.setPopupState({
        showPopupIntegration: true,
        showPopupChangeState: false
      });
      return;
    }
    this.isDisabled = true;
    this.reiFormService
      .updateStateAndToken(dataApi)
      .pipe(
        catchError((): any => {
          this.isDisabled = false;
          this.isUpdateToken = false;
          this.errorState = { ...this.errorState, accessToken: true };
          this.integrationsService.setPopupState({
            showPopupIntegration: true,
            showPopupChangeState: false
          });
        })
      )
      .subscribe((res) => {
        if (res) {
          this.integrationsService.setPopupState({
            showPopupChangeState: false
          });
          this.errorState = { ...this.errorState, accessToken: false };
          this.isUpdateToken = true;
          this.hasToken = true;
          this.currentToken = this.getToken();
          this.currentData = {
            regionId: this.getReiDomain(),
            accessToken: this.getToken()
          };
          this.reiFormService.getListReiForm().subscribe((data) => {
            this.reiFormDropdown = data;
          });

          const userInfo = this.userService.userInfo$.getValue();
          this.userService.userInfo$.next({
            ...userInfo,
            reiToken: this.currentData.accessToken
          });
          this.setIntegrationsDataAfterSetToken();
        }
      });
  }

  setIntegrationsDataAfterSetToken() {
    this.integrationsService.getIntegrationsDataApi().subscribe((res) => {
      this.integrationsService.setIntegrationsList(res);
      this.integrationsService.setPopupState({
        showPopupIntegration: false
      });
      this.isShowedPopupChangeState = false;
      this.isDisabled = false;
    });
  }

  getToken() {
    return this.formGroup.get('token').value;
  }

  getReiDomain() {
    return this.formGroup.get('reiDomain').value;
  }
}
