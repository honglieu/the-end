import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  Validators
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ERole } from '@/app/auth/auth.interface';
import { AgencyService } from '@services/agency.service';
import {
  INVITE_MEMBER_ERROR,
  INVITE_MEMBER_SENDING,
  INVITE_MEMBER_SUCCESSFULLY
} from '@services/messages.constants';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { Subject } from 'rxjs';
import { CompanyService } from '@services/company.service';
const provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => InviteTeamMembersComponent),
  multi: true
};

interface IExitMember {
  email: string;
  exist: boolean;
}

@Component({
  selector: 'invite-team-members',
  templateUrl: './invite-team-members.component.html',
  styleUrls: ['./invite-team-members.component.scss'],
  providers: [provider]
})
export class InviteTeamMembersComponent
  implements OnInit, ControlValueAccessor, OnChanges, OnDestroy
{
  @Output() onSubmit = new EventEmitter<any>();
  @Output() onClose = new EventEmitter<void>();
  @Input() show: boolean;
  @Input() canAssignOwner: boolean = false;
  memberForm: FormGroup;
  private requiredMessage: string = 'Required field';
  private onChange: any = () => {};
  private onTouch: any = () => {};
  private errors: boolean[] = [];
  private apiResponse: IExitMember[];
  public memberCount: number = 1;
  public disableButtonInvite: boolean = false;
  public isSubmit: boolean = false;
  inputValue: string;
  isInviteClicked = false;
  public listRole = new Map([
    [
      0,
      [
        { name: 'Administrator', value: ERole.ADMIN },
        { name: 'Team member', value: ERole.MEMBER }
      ]
    ]
  ]);
  private listRoleAccess = [
    { name: 'Administrator', value: ERole.ADMIN },
    { name: 'Team member', value: ERole.MEMBER }
  ];
  private roleOwnerItem = {
    name: 'Owner',
    value: ERole.OWNER
  };
  private unsubscribe = new Subject<void>();

  @ViewChild('elementRefInvite') elementRefInvite: ElementRef;
  public heightModal;

  constructor(
    private formBuilder: FormBuilder,
    private toastService: ToastrService,
    private agencyService: AgencyService,
    private agencyDashboardService: AgencyDashboardService,
    private companyService: CompanyService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['canAssignOwner']?.currentValue !== null &&
      this.canAssignOwner
    ) {
      this.listRoleAccess.push(this.roleOwnerItem);
      this.listRole.set(0, this.listRoleAccess);
      if (
        this.memberControls?.controls &&
        this.memberControls.controls.length < 2
      ) {
        this.memberControls.controls[0].setValue(this.roleOwnerItem);
      }
    }
  }

  getHeight() {
    const modalElement = document.querySelector('.body');
    const heightBodyInvite = this.elementRefInvite?.nativeElement.clientHeight;
    if (modalElement) {
      if (heightBodyInvite > 430) {
        modalElement.classList.add('form-invite-team');
      }
    }
  }

  ngOnInit(): void {
    this.memberForm = this.formBuilder.group({
      members: this.formBuilder.array([this.createMemberFormGroup()])
    });
    this.subscribeValueChangeFormMember();
    this.emitChanges();

    if (
      this.canAssignOwner &&
      this.memberControls?.controls &&
      this.memberControls.controls.length < 2
    ) {
      this.memberControls.controls[0]
        .get('role')
        .setValue(this.roleOwnerItem.value);
    }
  }

  subscribeValueChangeFormMember() {
    this.memberForm.valueChanges.subscribe((data) => {
      this.setListRole(data);
    });
  }

  createMemberFormGroup(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      role: [null, Validators.required],
      title: ['', Validators.required]
    });
  }

  onInputChange(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const inputValue = input.value.trim();
    input.value = inputValue;
    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.isSubmit = false;
      const control = this.memberControls.controls[index];
      const formControl = control?.get(controlName);
      if (formControl) {
        if (inputValue === '') {
          formControl.setErrors({ required: true });
        } else {
          formControl.setErrors(null);
        }
        formControl.markAsTouched();
      }
    }
  }

  get memberControls(): FormArray {
    return this.memberForm?.get('members') as FormArray;
  }

  addMember(): void {
    this.isSubmit = false;
    if (this.memberCount >= 10) {
      return;
    }
    this.listRole.set(this.listRole.size, this.listRoleAccess);
    this.memberControls.push(this.createMemberFormGroup());
    this.emitChanges();
    this.memberCount++;
    this.getHeight();
  }

  removeMember(index: number): void {
    this.memberControls.removeAt(index);
    this.listRole.delete(index);
    let i = 0;
    for (const key of this.listRole.keys()) {
      this.listRole.set(i, this.listRole.get(key));
      i++;
    }
    this.errors.splice(index, 1);
    this.emitChanges();
    this.memberCount--;
    if (this.memberCount === 1) {
      const modalElement = document.querySelector('.body');
      modalElement.classList.remove('form-invite-team');
    }
  }

  inviteMembers(): void {
    this.isSubmit = true;
    const inviteData = {
      members: this.memberForm.value.members
    };
    this.memberControls.markAllAsTouched();
    if (!this.memberForm.invalid) {
      const hadRequireField = this.memberControls.controls.some(
        (control, index) => {
          return this.isNameInvalid(index);
        }
      );
      if (hadRequireField) {
        this.errors = this.memberControls.controls.map((control, index) => {
          return control.get('name').invalid || this.isNameInvalid(index);
        });
        return;
      }
      const hasEmailDuplicates = this.memberControls.controls.some(
        (control, index) => {
          return this.isEmailDuplicate(index);
        }
      );
      if (hasEmailDuplicates) {
        this.errors = this.memberControls.controls.map((control, index) => {
          return (
            control.get('email').invalid ||
            this.isEmailFormatInvalid(index) ||
            this.isCheckUsedEmail(index)
          );
        });
        return;
      }

      this.agencyService
        .checkEmailInvite({
          emails: inviteData.members.map((member) => member.email)
        })
        .subscribe((response: any) => {
          this.apiResponse = response.data;
          this.errors = this.memberControls.controls.map(
            (control, index) => control.invalid || this.isCheckUsedEmail(index)
          );
          if (!this.errors.some((error) => error)) {
            this.onSubmit.emit(inviteData);
            if (this.disableButtonInvite) {
              return;
            }
            this.disableButtonInvite = true;
            this.toastService.info(INVITE_MEMBER_SENDING, '', {
              messageClass: 'ellipsis',
              enableHtml: true
            });
            const listRoleAssigned =
              inviteData?.members.map((item) => item.role) ?? [];
            const anyRoleOwnerAssigned = listRoleAssigned.some(
              (role: ERole) => role === ERole.OWNER
            );

            if (anyRoleOwnerAssigned) {
              const companyId = this.companyService.currentCompanyId();
              const companies = this.companyService.getCompaniesValue();
              const currentCompany = companies.find(
                (item) => item.id === companyId
              );
              currentCompany.hasOwner = true;
              this.companyService.setCompanies(companies);
            }
            this.agencyService.inviteTeamMember(inviteData).subscribe({
              next: () => {
                this.toastService.clear();
                this.toastService.success(INVITE_MEMBER_SUCCESSFULLY);
              },
              error: () => {
                this.toastService.clear();
                this.toastService.error(INVITE_MEMBER_ERROR, '', {
                  enableHtml: true
                });
              },
              complete: () => {
                this.onClose.emit();
                this.memberForm.reset();
                this.disableButtonInvite = false;
              }
            });
          }
        });
    }
  }

  setListRole(data) {
    if (!data || !this.canAssignOwner) return;
    const listRoleAssigned = data?.members.map((item) => item.role) ?? [];
    const anyRoleOwnerAssigned = listRoleAssigned.findIndex(
      (role: ERole) => role === ERole.OWNER
    );
    if (anyRoleOwnerAssigned !== -1) {
      const roles = this.listRole
        .get(anyRoleOwnerAssigned)
        .filter((item) => item.value !== ERole.OWNER);
      for (const key of this.listRole.keys()) {
        if (anyRoleOwnerAssigned !== key) {
          this.listRole.set(key, roles);
        }
      }
    } else {
      for (const key of this.listRole.keys()) {
        if (anyRoleOwnerAssigned !== key) {
          this.listRole.set(key, this.listRoleAccess);
        }
      }
    }
  }

  isCheckUsedEmail(index: number): boolean {
    if (this.getEmailErrorMessage(index)) {
      return false;
    }
    const email = this.getFormControl(index, 'email').value;
    if (this.apiResponse && Array.isArray(this.apiResponse)) {
      const foundEmail = this.apiResponse.find(
        (response) => response.email === email
      );
      return foundEmail && foundEmail.exist;
    }
    return false;
  }

  isEmailRequired(index: number): boolean {
    const emailControl = this.getFormControl(index, 'email');
    if (emailControl.value?.length && emailControl.value?.trim() === '') {
      return true;
    }
    return this.isInvalid(emailControl, 'required');
  }

  isEmailFormatInvalid(index: number): boolean {
    const emailControl = this.getFormControl(index, 'email');
    const emailValue = emailControl.value?.trim();
    const emailPattern = /^[a-zA-Z0-9. _+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailValue.length > 0) {
      return !emailPattern.test(emailValue);
    }
    return false;
  }

  isInvalid(control: AbstractControl, validation: string): boolean {
    return control.hasError(validation) && control.touched;
  }

  isEmailDuplicate(index: number): boolean {
    const email = this.getFormControl(index, 'email').value.trim();
    const members = this.memberForm.value.members;
    if (email.length === 0) {
      return false;
    }
    for (let i = 0; i < members.length; i++) {
      if (i !== index && members[i].email === email) {
        return true;
      }
    }
    return false;
  }

  getEmailErrorMessage(index: number): string {
    const emailControl = this.getFormControl(index, 'email');
    if (this.isEmailRequired(index)) {
      return this.requiredMessage;
    }
    if (this.isEmailFormatInvalid(index)) {
      return 'Incorrect email format';
    }
    if (this.isEmailDuplicate(index)) {
      return 'Email address already in use';
    }
    return '';
  }

  isNameInvalid(index: number): boolean {
    const nameControl = this.getFormControl(index, 'name');
    if (nameControl.value.length && nameControl.value.trim() == '') return true;
    return this.isInvalid(nameControl, 'required');
  }

  isTitleInvalid(index: number): boolean {
    const titleControl = this.getFormControl(index, 'title');
    if (titleControl.value.length && titleControl.value.trim() == '')
      return true;
    return this.isInvalid(titleControl, 'required');
  }
  isRoleInvalid(index: number): boolean {
    const roleControl = this.getFormControl(index, 'role');
    return this.isInvalid(roleControl, 'required');
  }

  isFormInvalid(): boolean {
    return this.memberForm.invalid;
  }

  emitChanges(): void {
    this.onChange(this.memberForm.value.members);
    this.onTouch(this.memberForm.value.members);
  }

  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.memberForm.setControl('members', this.formBuilder.array(value));
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  private getFormControl(index: number, fieldName?: string): AbstractControl {
    const memberControl = this.memberControls.at(index);
    if (fieldName) {
      return memberControl.get(fieldName);
    }
    return memberControl;
  }

  public closeModal() {
    this.onClose.emit();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
