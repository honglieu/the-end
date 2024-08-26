import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { conversations, users } from 'src/environments/environment';
import { AgentUserService } from '@/app/user/agent-user/agent-user.service';
import { ApiService } from '@services/api.service';
import { PopupService, PopupState } from '@services/popup.service';
import { ActionLinkService } from '@services/action-link.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { LoaderService } from '@services/loader.service';
import {
  ActionLinkItem,
  FormInputProps,
  GlobalActionLinkResponse
} from '@shared/types/action-link.interface';
import { CurrentUser } from '@shared/types/user.interface';
import { TaskService } from '@services/task.service';
import { LoadingService } from '@services/loading.service';

@Component({
  selector: 'app-global-action-link',
  templateUrl: './global-action-link.component.html',
  styleUrls: ['./global-action-link.component.scss']
})
export class GlobalActionLinkComponent implements OnInit, OnDestroy {
  @ViewChild('table') table: ElementRef<HTMLDivElement>;
  private unsubscribe = new Subject<void>();
  private listofConversationCategory: any = [];
  public actionLinksList: ActionLinkItem[] = [];
  public popupModalPosition = ModalPopupPosition;
  public isShowQuitConfirm = false;
  public isShowCreateEditActionLinkModal = false;
  public isShowCreateEditActionLinkSuccessModal = false;
  public isCreateActionLink: boolean;
  public isShowConfirmDeleteActionLink = false;
  public isShowDeleteSuccessModal = false;
  public dataTable;
  public hasPermissionToCreateEditDelete = false;
  public itemPerRowOptions = [
    {
      id: 1,
      text: 10
    },
    {
      id: 2,
      text: 20
    },
    {
      id: 3,
      text: 50
    },
    {
      id: 4,
      text: 100
    }
  ];
  public selectedRowOption = 2;
  public pageIndex = 0;
  public pageSize: number = Number(this.itemPerRowOptions[1].text);
  public selectedActionLinkToEdit: FormInputProps;
  scrollTableTimeout: NodeJS.Timeout;
  formMode: 'create' | 'update' = 'create';

  constructor(
    private apiService: ApiService,
    private popupService: PopupService,
    private agentUserService: AgentUserService,
    private actionLinkService: ActionLinkService,
    private cdr: ChangeDetectorRef,
    private loaderService: LoaderService,
    private taskService: TaskService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.apiService
      .getAPI(users, 'current-user')
      .subscribe((res: CurrentUser) => {
        this.hasPermissionToCreateEditDelete = res.type !== 'AGENT';
      });
    this.getActionLinks(this.pageIndex, this.pageSize);
    this.getCategoryList();
  }

  ngOnDestroy(): void {
    clearTimeout(this.scrollTableTimeout);
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.popupService.isShowNewActionLinkModal.next({
      display: false,
      resetField: true
    });
  }

  getCategoryList() {
    const fullCategoryList = JSON.parse(
      localStorage.getItem('listCategoryTypes')
    );
    if (fullCategoryList) {
      this.listofConversationCategory = fullCategoryList;
    } else {
      this.apiService
        .getAPI(conversations, 'list')
        .pipe(takeUntil(this.unsubscribe))
        .subscribe((res) => {
          if (res && res.list) {
            this.listofConversationCategory = res.list;
            localStorage.setItem('listCategoryTypes', JSON.stringify(res.list));
          }
        });
    }
  }

  getActionLinks(pageIndex: number, pageSize: number) {
    const pi = pageIndex?.toString().trim();
    const ps = pageSize?.toString().trim();
    this.loadingService.onLoading();
    this.apiService
      .getAPI(conversations, `action-link-pagination?page=${pi}&size=${ps}`)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(
        (result: GlobalActionLinkResponse) => {
          if (result && result.response) {
            this.actionLinksList = [
              ...result.response.sort((a, b) =>
                (a.createdAt || '') < (b.createdAt || '') ? 1 : -1
              )
            ];
            this.dataTable = result;
            this.loadingService.stopLoading();
          } else {
            this.loadingService.stopLoading();
          }
        },
        () => {
          this.loadingService.stopLoading();
        }
      );
  }

  public getCategoryDetails(categoryId) {
    return (
      this.listofConversationCategory.find((cat) => cat.id === categoryId) || {}
    );
  }

  itemPerRowChanged(event) {
    if (event) {
      this.pageSize = event.text;
      this.pageIndex = 0;
      this.getActionLinks(this.pageIndex, this.pageSize);
    }
  }

  handleCreateEdit(event) {
    if (event) {
      this.isShowCreateEditActionLinkModal = false;
      this.isShowCreateEditActionLinkSuccessModal = true;
      this.scrollTableTimeout = setTimeout(() => {
        this.table.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      setTimeout(() => {
        this.getActionLinks(this.pageIndex, this.pageSize);
        this.isShowCreateEditActionLinkSuccessModal = false;
      }, 3000);
    }
  }

  editActionLink(actionLink, status) {
    this.formMode = 'update';
    if (status) {
      this.selectedActionLinkToEdit = actionLink;
      this.cdr.markForCheck();
      this.isCreateActionLink = false;
      this.isShowCreateEditActionLinkModal = true;
      this.popupService.isShowNewActionLinkModal.next({
        display: true,
        resetField: false
      });
      this.isShowQuitConfirm = false;
    } else {
      this.isShowCreateEditActionLinkModal = false;
    }
  }

  createNewActionLink(status: PopupState) {
    this.formMode = 'create';
    if (status.display) {
      this.isCreateActionLink = true;
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

  handleFormActionLinkChanged(event) {
    this.selectedActionLinkToEdit = event;
    this.cdr.markForCheck();
  }

  showConfirmDelete(status) {
    this.isShowConfirmDeleteActionLink = status;
  }

  deleteActionLink(item, status) {
    if (status) {
      this.isShowConfirmDeleteActionLink = true;
      this.actionLinkService.globalActionLink.next(item);
    } else {
      this.isShowConfirmDeleteActionLink = false;
    }
  }

  showDeleteSuccess(status) {
    if (status) {
      this.isShowConfirmDeleteActionLink = false;
      this.isShowDeleteSuccessModal = true;
      setTimeout(() => {
        this.isShowDeleteSuccessModal = false;
      }, 3000);
      this.getActionLinks(this.pageIndex, this.pageSize);
    }
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

  onGoToFirstPage(pageSize) {
    if (pageSize) {
      this.pageIndex = 0;
      this.getActionLinks(0, pageSize);
    }
  }

  onGoToPrevPage(pageSize) {
    if (pageSize) {
      this.pageIndex--;
      this.getActionLinks(this.pageIndex, pageSize);
    }
  }

  onGoToNextPage(pageSize) {
    if (pageSize) {
      this.pageIndex++;
      this.getActionLinks(this.pageIndex, pageSize);
    }
  }

  onGoToLastPage(pageSize) {
    if (pageSize) {
      this.pageIndex = this.dataTable.totalPages - 1;
      this.getActionLinks(this.pageIndex, pageSize);
    }
  }
}
