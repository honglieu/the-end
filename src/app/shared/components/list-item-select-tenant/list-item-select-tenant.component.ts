import {
  Component,
  EventEmitter,
  Input,
  Output,
  forwardRef
} from '@angular/core';
import { UserService } from '@services/user.service';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { CheckBoxImgPath } from '@shared/enum/share.enum';
import { Personal, User } from '@shared/types/user.interface';
import { PhoneNumberFormatPipe } from '@shared/pipes/phonenumber-format.pipe';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'list-item-select-tenant',
  templateUrl: './list-item-select-tenant.component.html',
  styleUrls: ['./list-item-select-tenant.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListItemSelectTenantComponent),
      multi: true
    }
  ]
})
export class ListItemSelectTenantComponent implements ControlValueAccessor {
  @Input() listItemUsers: Personal[] = [];
  @Input() selectedUser = [];
  @Input() fieldInList: string;
  @Input() srcImg: string;
  @Input() srcImgCheck: string;
  @Input() srcImgUnCheck: string;
  @Input() peopleE2e: string;
  @Output() onScrollToTopList = new EventEmitter<void>();
  public checkBoxImg = CheckBoxImgPath;

  forwardButtonAction = ForwardButtonAction;
  value: User;
  disabled: boolean;
  onChange = (value) => {};
  onTouched = () => {};
  constructor(
    public userService: UserService,
    private phoneFormat: PhoneNumberFormatPipe
  ) {}
  writeValue(obj: any): void {
    this.value = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnInit(): void {
    // Remove ItemUsers have no phone number
    this.listItemUsers = this.listItemUsers
      .map((item) => {
        item.userProperties = item.userProperties?.filter(
          (item) => item.user?.phoneNumber
        );
        return item;
      })
      .filter((item) => {
        return item.userProperties && item.userProperties.length > 0;
      });
  }
}
