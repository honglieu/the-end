import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { SharedService } from '@services/shared.service';
import { TaskService } from '@services/task.service';
import { REIFormDocumentStatus } from '@shared/enum';
import { EButtonWidget, EButtonType } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ReiFormLink, ReiFormWidget } from '@shared/types/rei-form.interface';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  switchMap,
  map,
  startWith,
  of,
  Subscription,
  Subject,
  lastValueFrom,
  takeUntil,
  catchError,
  first
} from 'rxjs';
import { SYNC_STATUS } from '@/app/task-detail/modules/steps/constants/constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { TIME_FORMAT } from '@services/constants';
import { ECrmStatus } from '@/app/user/utils/user.enum';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'rei-form',
  templateUrl: './rei-form.component.html',
  styleUrls: ['./rei-form.component.scss']
})
export class ReiFormComponent implements OnInit, OnDestroy {
  @Input() crmStatusOfConversation: ECrmStatus;
  @Input() isDisableActionByOffBoardStatus: boolean;
  @Input() disabled: boolean;
  @Input() currentTaskId: string;

  private getFormsForWidget$: Subscription;
  private unsubscribe = new Subject<void>();
  public reiForms$: BehaviorSubject<{
    isLoading: boolean;
    result: ReiFormWidget[];
  }> = new BehaviorSubject({
    isLoading: false,
    result: []
  });
  public reiFormLink: ReiFormLink;
  public showReviewAttachPopup: boolean;
  public reiFormDocumentStatus = REIFormDocumentStatus;
  public isConsole: boolean;
  public textToolTipSync = 'Sync';
  public TYPE_SYNC = SYNC_STATUS;
  public isStatusSync: string = this.TYPE_SYNC.UNSYNC;
  public paragraph: object = { rows: 0 };
  public showWarningModal: boolean = false;
  public isShowPopup: boolean = false;
  public ECrmStatus = ECrmStatus;

  constructor(
    private reiFormService: ReiFormService,
    private taskService: TaskService,
    private preventButtonService: PreventButtonService,
    private fileService: FilesService,
    private trudiSendMsgService: TrudiSendMsgService,
    private sharedService: SharedService,
    private toastService: ToastrService,
    private agencyDateFormatService: AgencyDateFormatService
  ) {}

  ngOnInit(): void {
    this.isConsole = this.sharedService.isConsoleUsers();
    this.getForms();
    const isLoaded$ = new Subject<void>();
    this.reiForms$.pipe(takeUntil(isLoaded$)).subscribe((res) => {
      if (!res?.isLoading) {
        isLoaded$.next();
        isLoaded$.complete();
        if (res?.result?.length) {
          this.onSyncAll();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
    this.getFormsForWidget$.unsubscribe();
  }

  onSyncAll(event?: MouseEvent) {
    event?.stopPropagation();
    this.textToolTipSync = 'Syncing';
    this.isStatusSync = this.TYPE_SYNC.INPROGRESS;
    this.reiFormService
      .updateAllListReiForm(
        this.currentTaskId || this.taskService?.currentTaskId$.value
      )
      .pipe(
        map((forms) => {
          if (forms) {
            if (forms.status === this.TYPE_SYNC.COMPLETED) {
              const { DATE_FORMAT_DAYJS } =
                this.agencyDateFormatService.dateFormat$.getValue();
              const date = this.agencyDateFormatService.formatTimezoneDate(
                forms.time,
                DATE_FORMAT_DAYJS + ' ' + TIME_FORMAT
              );
              this.textToolTipSync = `Last sync time: ${date}`;
              this.fileService.reloadAttachments.next(true);
            } else {
              this.textToolTipSync = 'Failed to sync';
            }
            this.isStatusSync = forms.status;
          }
          return { isLoading: false, result: [...(forms?.data || [])] };
        }),
        catchError((error) => {
          this.textToolTipSync = 'Failed to sync';
          this.isStatusSync = this.TYPE_SYNC.FAILED;
          return of({
            isLoading: this.reiForms$.value.isLoading,
            result: this.reiForms$.value.result
          });
        }),
        startWith({
          isLoading: this.reiForms$.value.isLoading,
          result: this.reiForms$.value.result
        })
      )
      .subscribe((res) => {
        this.reiForms$.next(res);
      });
  }

  getForms() {
    this.getFormsForWidget$ = new BehaviorSubject<unknown>(null)
      .asObservable()
      .pipe(
        switchMap(() => this.reiFormService.createReiFormLink$),
        switchMap(() => this.reiFormService.updateReiFormData$),
        switchMap(() =>
          this.currentTaskId
            ? of(this.currentTaskId)
            : this.taskService.currentTaskId$.pipe(first(Boolean))
        ),
        switchMap((taskId) => {
          if (this.currentTaskId || taskId) {
            return this.reiFormService
              .getFormsForWidget(this.currentTaskId || taskId)
              .pipe(
                map((forms) =>
                  forms.sort(
                    (firstForm, secondForm) =>
                      secondForm.updated - firstForm.updated
                  )
                ),
                map((forms) => ({ isLoading: false, result: [...forms] })),
                startWith({ isLoading: true, result: [] })
              );
          }

          return of({ isLoading: true, result: [] });
        })
      )
      .subscribe((res) => {
        this.reiForms$.next(res);
      });
  }

  trackByFormId(index: number, form: ReiFormWidget) {
    return form.id;
  }

  async openReviewAttacmentPopup(formId: string) {
    if (!this.shouldHandleProcess()) return;
    try {
      this.reiFormLink = await lastValueFrom(
        this.reiFormService.createLinkReiForm(formId, this.currentTaskId).pipe(
          catchError((err) => {
            const formNotFound = err?.error?.message?.includes('404');
            this.toastService.error(
              formNotFound ? 'Form not found.' : 'An error has occurred.'
            );
            return of(null);
          })
        )
      );
      this.showReviewAttachPopup = true;
    } catch (error) {
      console.error(error);
      this.showWarningModal = true;
    }
  }

  shouldHandleProcess(): boolean {
    return this.preventButtonService.shouldHandleProcess(
      EButtonWidget.REI_FORM,
      EButtonType.WIDGET
    );
  }

  onReviewAttachmentPopupClosed() {
    this.showReviewAttachPopup = false;
  }

  async downloadFile(event: MouseEvent, form: ReiFormWidget, button: Element) {
    event.stopPropagation();
    const callBack = async () => {
      const response = await lastValueFrom(
        this.reiFormService.downloadSignedReiFormDetail(form.id)
      );
      const _ =
        response?.url &&
        this.fileService.downloadResource(response.url, form.name);
    };
    this.handleClickButtonAction(button, '-downloading', callBack);
  }

  async refreshForm(event: MouseEvent, form: ReiFormWidget, button: Element) {
    event.stopPropagation();
    const callBack = async () => {
      const taskId =
        this.currentTaskId || this.taskService.currentTaskId$.getValue();
      const response = await lastValueFrom(
        this.reiFormService.refreshFormWidget(taskId, form.id)
      );
      if (response?.diff && response?.reiFormDetails) {
        form.status = response.reiFormDetails.status;
        form.signers = response.reiFormDetails.signers;
        form.name = response.reiFormDetails.name;
        if (response?.reiFormDetails.isCompleted) {
          this.fileService.reloadAttachments.next(true);
        }
      }
    };
    this.handleClickButtonAction(button, '-refreshing', callBack);
  }

  private async handleClickButtonAction(
    button: Element,
    loadingClassName: string,
    callBack: () => Promise<void>
  ): Promise<void> {
    if (button.classList.contains(loadingClassName)) {
      return;
    }

    try {
      this.setTrudiIconClass(button, true, loadingClassName);
      const _ = await callBack();
    } catch (error) {
      console.error(error);
    } finally {
      this.setTrudiIconClass(button, false, loadingClassName);
    }
  }

  private setTrudiIconClass(
    button: Element,
    state: boolean,
    className: string
  ) {
    if (state) {
      button.classList.add(className);
    } else {
      button.classList.remove(className);
    }
  }

  togglePopover() {
    this.isShowPopup = !this.isShowPopup;
  }
}
