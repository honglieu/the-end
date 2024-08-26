import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { LoadingService } from '@services/loading.service';
import { ReiFormOption } from '@shared/types/conversation.interface';

@Component({
  selector: 'integrations-form',
  templateUrl: './integrations-form.component.html',
  styleUrls: ['./integrations-form.component.scss'],
  providers: [LoadingService]
})
export class IntegrationsFormComponent implements OnInit, OnChanges {
  @Input() formGroup: FormGroup;
  @Input() reiFormDropdown: ReiFormOption[] = [];

  @Input() listProviderAccessToken = [
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
  @Input() stateWarningTitle = 'Are you sure you want to change the state?';
  @Input() currentToken = '';
  @Input() currentData = {
    regionId: '',
    accessToken: ''
  };
  @Input() errorState = {
    regionId: false,
    accessToken: false
  };
  @Input() isUpdateToken: boolean = false;
  @Input() hasToken: boolean = false;
  @Input() showPopupChangeState: boolean = false;
  public isBlur = true;

  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reiFormDropdown']?.currentValue) {
      this.reiFormDropdown = this.reiFormDropdown.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  }

  changeSelect(e) {
    this.formGroup.get('token').setValue(e.token);
    this.isUpdateToken = !!e.token;
    this.currentToken = e.token;
    this.errorState = {
      regionId: false,
      accessToken: false
    };
  }

  editToken() {
    this.isUpdateToken = false;
    this.errorState.accessToken = false;
  }

  onBlur() {
    this.isBlur = true;
    this.isUpdateToken =
      this.getToken() &&
      this.getToken() === this.currentToken &&
      this.getReiDomain() === this.currentData.regionId;
  }

  onFocus() {
    this.isBlur = false;
    this.isUpdateToken = false;
  }

  getToken() {
    return this.formGroup.get('token').value;
  }

  getReiDomain() {
    return this.formGroup.get('reiDomain').value;
  }
}
