import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  catchError,
  finalize,
  map,
  pluck,
  takeUntil,
  tap
} from 'rxjs/operators';
import { ApiService } from '@services/api.service';
import { conversations, users } from 'src/environments/environment';
import { AgencyService } from '@services/agency.service';
import {
  ActionLinkItem,
  ActionLinkProp,
  CategoryUser
} from '@shared/types/action-link.interface';
import { ConversationService } from '@services/conversation.service';
import { blockOverlayScroll } from '@shared/feature/function.feature';
import { LoaderService } from '@services/loader.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { PopupService, PopupState } from '@services/popup.service';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { ActionLinkService } from '@services/action-link.service';
import { CurrentUser } from '@shared/types/user.interface';

@Component({
  selector: 'app-send-action-link',
  templateUrl: './send-action-link.component.html',
  styleUrls: ['./send-action-link.component.scss']
})
export class SendActionLinkComponent implements OnInit, OnDestroy {
  @Input() show = false;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() close = new EventEmitter<boolean>();
  public currentPropertyId: string;
  public currentConversationId: any;
  public agentJoined: any;
  public fullCategoryList: any = [];
  private unsubscribe = new Subject<void>();

  actionLinkList: Observable<ActionLinkProp[]> = of([]);
  isShowCreateEditActionLinkModal = false;
  popupModalPosition = ModalPopupPosition;
  selectedActionLinkToEdit: ActionLinkItem;
  isShowQuitConfirm = false;
  isCreateActionLink = false;
  isCreateLabel = true;
  formMode: 'create' | 'update' = 'create';
  hasPermissionToCreateEdit = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private agencyService: AgencyService,
    private readonly conversationService: ConversationService,
    private loaderService: LoaderService,
    private readonly cdr: ChangeDetectorRef,
    private readonly popupService: PopupService,
    private readonly agentUserService: AgentUserService,
    private readonly actionLinkService: ActionLinkService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.show) {
      this.getListActionlink();
    }
  }

  ngOnInit() {}

  getListActionlink(): void {
    this.apiService
      .getAPI(users, 'current-user')
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res: CurrentUser) => {
        this.hasPermissionToCreateEdit = res.type !== 'AGENT';
      });
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams.hasOwnProperty('conversationId')) {
      this.actionLinkList = this.apiService
        .getData<ActionLinkProp[]>(
          `${conversations}action-link/${queryParams['conversationId']}`
        )
        .pipe(
          tap(() => {
            this.loaderService.removeLoadingLayer();
          }),
          pluck('body'),
          map((list: ActionLinkProp[]) =>
            list.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
          ),
          catchError(() => {
            this.loaderService.removeLoadingLayer();
            return of([]);
          }),
          finalize(() => {
            this.loaderService.removeLoadingLayer();
          })
        );
    }
    const fullCategoryList = JSON.parse(
      localStorage.getItem('listCategoryTypes')
    );
    if (fullCategoryList) {
      this.fullCategoryList = fullCategoryList;
    }
    window.loader.ajaxindicatorstop();
  }

  public getCategoryDetail(categoryId): CategoryUser {
    const categoryDetails =
      this.fullCategoryList.find((cat) => cat.id === categoryId) || {};
    if (categoryId === '0d2817fa-9687-11e9-bc42-526af7764f64') {
      categoryDetails.svg = 'old-rent.svg';
      categoryDetails.color = 'rgb(0, 169, 159)';
      categoryDetails.hideEdit = true;
    }
    return categoryDetails as CategoryUser;
  }

  cancel() {
    this.close.emit(true);
    this.actionLinkService.getActionLink();
    /*const agencyId = this.agencyService.currentAgencyId.getValue();
    this.router.navigate([`dashboard/${agencyId}/messages/${this.currentPropertyId}`],
      {
        queryParams:
          {
            'conversationId': this.currentConversationId
          }
      });*/
  }

  onLinkSelected(e: MouseEvent, id: string, actionLink: ActionLinkProp): void {
    e.stopPropagation();
    this.conversationService.actionLinkTransfer.next({ id, actionLink });
    this.close.emit(true);
  }

  onSend(actionLinkId, item) {
    if (!this.agentJoined) {
      this.sendLink(actionLinkId, item);
      return;
    }
    this.apiService
      .postAPI(conversations, 'agent-join-to-conversation', {
        conversationId: this.currentConversationId,
        propertyId: this.currentPropertyId
      })
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.sendLink(actionLinkId, item);
      });
  }

  sendLink(actionLinkId, item) {
    const body = {
      actionLink: item,
      conversationId: this.currentConversationId,
      message: item.title,
      propertyId: this.currentPropertyId
    };
    this.apiService
      .postAPI(conversations, 'action-link-message', body)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(() => {
        this.router.navigate([`dashboard/messages/${this.currentPropertyId}`], {
          queryParams: {
            conversationId: this.currentConversationId
          }
        });
      });
  }

  /* createNewActionLink() {
    this.route.url.subscribe((value) => {
      const agencyId = this.agencyService.currentAgencyId.getValue();
      this.router.navigate([`${agencyId}/${this.currentPropertyId}/${this.currentConversationId}/action-link/new/${value[3].path}`]);
    });
  } */ /*Temporarily deprecated*/

  editActionLink2(actionLink) {
    this.isCreateLabel = false;
    this.formMode = 'update';
    blockOverlayScroll(true);
    this.selectedActionLinkToEdit = actionLink;
    this.cdr.markForCheck();
    this.isShowCreateEditActionLinkModal = true;
    this.popupService.isShowNewActionLinkModal.next({
      display: true,
      resetField: false
    });
  }
  public ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  handleCreateEdit() {
    this.getListActionlink();
    this.isShowCreateEditActionLinkModal = false;
    this.isCreateActionLink = true;
    setTimeout(() => (this.isCreateActionLink = false), 3000);
  }

  handleFormActionLinkChanged(event) {
    this.selectedActionLinkToEdit = event;
    this.cdr.markForCheck();
  }

  open() {
    this.formMode = 'create';
    this.isShowCreateEditActionLinkModal = true;
    this.isCreateLabel = true;
    blockOverlayScroll(true);
  }
  quit(status: boolean) {
    if (status) {
      this.isShowQuitConfirm = true;
      this.isShowCreateEditActionLinkModal = false;
    } else {
      this.isShowQuitConfirm = false;
      this.isShowCreateEditActionLinkModal = false;
      this.agentUserService.setIsCloseAllModal(true);
      this.selectedActionLinkToEdit = null;
      this.cdr.markForCheck();
    }
    blockOverlayScroll(false);
  }

  showQuitConfirm(status: boolean) {
    if (status) {
      this.isShowQuitConfirm = true;
      this.isShowCreateEditActionLinkModal = false;
    } else {
      this.isShowQuitConfirm = false;
      this.isShowCreateEditActionLinkModal = false;
      this.agentUserService.setIsCloseAllModal(true);
      this.selectedActionLinkToEdit = null;
      this.cdr.markForCheck();
    }
  }
  createNewActionLink(status: PopupState) {
    if (status.display) {
      this.isShowCreateEditActionLinkModal = true;
      this.popupService.isShowNewActionLinkModal.next(status);
      this.selectedActionLinkToEdit = this.selectedActionLinkToEdit
        ? this.selectedActionLinkToEdit
        : null;
      this.cdr.markForCheck();
      this.isShowQuitConfirm = false;
    } else {
      this.isShowCreateEditActionLinkModal = false;
    }
  }
}
