import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { Subject, finalize, map, takeUntil } from 'rxjs';
import { ERole } from '@/app/auth/auth.interface';
import { ApiService } from '@services/api.service';
import { Auth0Service } from '@services/auth0.service';
import { UserService } from '@services/user.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { Team, TeamsByProperty } from '@shared/types/team.interface';
import {
  IMailBoxAssignee,
  TypeMailPermissions
} from '@shared/types/user.interface';
import { agencies, users } from 'src/environments/environment';

type TypeUsersReasign = {
  mailBoxId: string;
  usersReassign: string[];
};
interface UserReassignData {
  userReassignOwner: string;
  usersReassign: TypeUsersReasign[];
}

@Component({
  selector: 'delete-account-popup',
  templateUrl: './delete-account-popup.component.html',
  styleUrls: ['./delete-account-popup.component.scss']
})
export class DeleteAccountPopupComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter();
  @Input() listMailboxAssignee: IMailBoxAssignee[];
  @Input() isRoleOwner: boolean = false;
  @Input() isShowModalForm: boolean = false;
  @Input() isShowModalConfirm: boolean = false;
  @ViewChild('ngSelectSender', { static: true })
  ngSelectSender: NgSelectComponent;

  public listData: Team[];
  public loadingListData: boolean = false;
  public popupModalPosition = ModalPopupPosition;
  public formGroup: FormGroup;
  private unsubscribe = new Subject<void>();
  public role = ERole;
  public userId: string = '';
  public searchTerm: string = '';
  public isSubmit: boolean = false;
  public isOpen: boolean = false;

  get isUsersReassignFormArray() {
    return this.formGroup?.get('usersReassign') instanceof FormArray;
  }

  get usersReassignForm() {
    return this.formGroup?.get('usersReassign') as FormArray;
  }

  get userReassignOwnerForm() {
    return this.formGroup?.get('userReassignOwner');
  }

  constructor(
    public userService: UserService,
    private apiService: ApiService,
    private auth0Service: Auth0Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userService.userInfo$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((user) => {
        if (user) {
          this.userId = user.id;
        }
      });
    this.getListAccount();
  }

  createMessageFormControl = () => {
    return new FormGroup({
      usersReassignList: new FormControl([], Validators.required)
    });
  };

  clearAllUsersReassignList(index) {
    this.usersReassignForm.controls[index]
      .get('usersReassignList')
      .setValue([]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isShowModalForm'] || changes['isRoleOwner']) {
      if (this.isShowModalForm) {
        this.formGroup = new FormGroup({
          userReassignOwner: new FormControl(
            null,
            this.isRoleOwner ? [Validators.required] : []
          ),
          usersReassign: new FormArray([])
        });
      }
    }

    if (changes['listMailboxAssignee'].currentValue?.length) {
      for (const element of this.listMailboxAssignee) {
        this.usersReassignForm?.push(this.createMessageFormControl());
      }
    }
  }

  getListAccount() {
    this.loadingListData = true;
    this.apiService
      .getAPI(agencies, `team?filterStatus=ACTIVE`)
      .pipe(
        takeUntil(this.unsubscribe),
        map((res: TeamsByProperty) => {
          return res.list;
        }),
        map((listData) => {
          const indexToRemove = listData.findIndex(
            (item) => item.id === this.userId
          );
          if (indexToRemove !== -1) {
            listData.splice(indexToRemove, 1);
          }
          return listData;
        }),
        finalize(() => {
          this.loadingListData = false;
        })
      )
      .subscribe((finalListData) => {
        this.listData = finalListData;
      });
  }

  handleDeleteAccount(payload: UserReassignData) {
    this.apiService
      .deleteByPost(`${users}/delete-account`, payload)
      .subscribe(() => {
        this.auth0Service
          .logout()
          .pipe(takeUntil(this.unsubscribe))
          .subscribe();
      });
  }

  isOpenModalForm(state: boolean) {
    this.isShowModalForm = state;
  }

  isOpenModalConfirm(state: boolean) {
    this.isShowModalConfirm = state;
  }

  customSearchFn(term: string, item: Team & TypeMailPermissions) {
    const valueSearch =
      (item?.firstName || item?.companyAgent?.user?.firstName)?.trim() +
      ' ' +
      (item?.lastName || item?.companyAgent?.user?.lastName)?.trim();
    const searchByName =
      valueSearch?.toLowerCase().indexOf(term?.trim().toLowerCase()) > -1;

    return searchByName;
  }

  handlerHighlight(data) {
    this.searchTerm = data?.term?.trim();
  }

  onConfirm() {
    // Mark all form controls within the FormGroup as touched
    this.isSubmit = true;
    this.userReassignOwnerForm.markAllAsTouched();
    this.usersReassignForm.controls.forEach((control) => {
      control.get('usersReassignList')?.markAsTouched();
    });

    if (!this.formGroup?.valid) return;
    this.isOpenModalForm(false);
    this.isSubmit = false;
    this.isOpenModalConfirm(true);
  }

  onSubmit() {
    const usersReassign: TypeUsersReasign[] = this.listMailboxAssignee.map(
      (item, index) => {
        return {
          mailBoxId: item.id,
          usersReassign:
            this.usersReassignForm.controls[index].get('usersReassignList')
              ?.value
        };
      }
    );
    const payload = {
      userReassignOwner: this.userReassignOwnerForm?.value || null,
      usersReassign
    };
    this.handleDeleteAccount(payload);
  }

  handleEmitClose() {
    this.onClose.emit();
  }

  openSelect() {
    this.isOpen = true;
    this.cdr.markForCheck();
  }

  closeSelect() {
    this.isOpen = false;
    this.searchTerm = '';
    this.cdr.markForCheck();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
