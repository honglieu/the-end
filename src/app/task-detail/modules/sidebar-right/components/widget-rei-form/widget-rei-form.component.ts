import { catchError, takeUntil } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  lastValueFrom,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';
import { FilesService } from '@services/files.service';
import { ReiFormService } from '@services/rei-form.service';
import { TaskService } from '@services/task.service';
import { ModalPopupPosition } from '@shared/components/modal-popup/modal-popup';
import { REIFormDocumentStatus } from '@shared/enum/share.enum';
import { ReiFormWidget } from '@shared/types/rei-form.interface';
import { TrudiSendMsgService } from '@/app/trudi-send-msg/services/trudi-send-msg.service';
import { SYNC_STATUS } from '@/app/task-detail/modules/steps/constants/constants';
import { TIME_FORMAT } from '@services/constants';
import { AgencyDateFormatService } from '@/app/dashboard/services/agency-date-format.service';
import { SharedService } from '@services/shared.service';
import { EButtonType, EButtonWidget } from '@trudi-ui';
import { PreventButtonService } from '@trudi-ui';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'widget-rei-form',
  templateUrl: './widget-rei-form.component.html',
  styleUrls: ['./widget-rei-form.component.scss']
})
export class WidgetReiFormComponent implements OnInit, OnDestroy {
  public reiFormDocumentStatus = REIFormDocumentStatus;

  public modalPopupPosition = ModalPopupPosition;

  public reiForms$: BehaviorSubject<{
    isLoading: boolean;
    result: ReiFormWidget[];
  }> = new BehaviorSubject({
    isLoading: false,
    result: []
  });

  private unsubscribe = new Subject<void>();

  public paragraph: object = { rows: 0 };

  public TYPE_SYNC = SYNC_STATUS;

  public isStatusSync: string = this.TYPE_SYNC.UNSYNC;

  public textToolTipSync = 'Sync';
  public getFormsForWidget$: Subscription;
  public isConsole: boolean;
  public EButtonType = EButtonType;
  public EButtonWidget = EButtonWidget;

  constructor(
    private fileService: FilesService,
    private reiFormService: ReiFormService,
    private taskService: TaskService,
    private agencyDateFormatService: AgencyDateFormatService,
    private toastService: ToastrService,
    private PreventButtonService: PreventButtonService,
    private sharedService: SharedService
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

  getForms() {
    this.getFormsForWidget$ = new BehaviorSubject<unknown>(null)
      .asObservable()
      .pipe(
        switchMap(() => this.reiFormService.createReiFormLink$),
        switchMap(() => this.reiFormService.updateReiFormData$),
        switchMap(() => this.taskService.currentTaskId$),
        switchMap((taskId) => {
          if (taskId) {
            return this.reiFormService.getFormsForWidget(taskId).pipe(
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
    const reiFormLink = await lastValueFrom(
      this.reiFormService.createLinkReiForm(formId).pipe(
        catchError((err) => {
          const formNotFound = err?.error?.message?.includes('404');
          this.toastService.error(
            formNotFound ? 'Form not found.' : 'An error has occurred.'
          );
          return of(null);
        })
      )
    );
    if (!reiFormLink) {
      this.PreventButtonService.deleteProcess(
        EButtonWidget.REI_FORM,
        EButtonType.WIDGET
      );
      return;
    }
    this.reiFormService.reiFormLink.next(reiFormLink);
    this.reiFormService.popupReiForm.next({
      isShowREIFormPopup: false,
      showReviewAttachPopup: true
    });
  }

  onSyncAll(event?: MouseEvent) {
    event?.stopPropagation();
    this.textToolTipSync = 'Syncing';
    this.isStatusSync = this.TYPE_SYNC.INPROGRESS;
    this.reiFormService
      .updateAllListReiForm(this.taskService?.currentTaskId$.value)
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
      const taskId = this.taskService.currentTaskId$.getValue();
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
}
