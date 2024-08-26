import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import dayjs from 'dayjs';
import { SyncMaintenanceType } from '@shared/enum/sendMaintenance.enum';
import { MaintenanceRequestService } from '@services/maintenance-request.service';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { ForwardButtonAction } from '@shared/enum/forwardButtonActionType.enum';
import { ToastrService } from 'ngx-toastr';
import { UNABLE_SYNC_PROPERTY_TREE } from '@services/messages.constants';
import { TaskService } from '@services/task.service';
import { AgencyService } from '@services/agency.service';
import { ConversationService } from '@services/conversation.service';
import { SharedService } from '@services/shared.service';

interface InvoiceFile {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

@Component({
  selector: 'send-invoice-pt',
  templateUrl: './send-invoice-pt.component.html',
  styleUrls: ['./send-invoice-pt.component.scss']
})
export class SendInvoicePtComponent implements OnInit {
  @Input() dataE2e: boolean;
  @Input() show = false;
  @Input() contents = [
    'I will be uploading the following invoice details against this maintenance request in Property Tree'
  ];
  @Output() onClose = new EventEmitter<boolean>();

  public invoiceInformation: FormGroup;
  public invoiceFile: InvoiceFile;
  public TYPE_SYNC_MAINTENANCE = SyncMaintenanceType;
  private subscribe = new Subject<void>();
  constructor(
    private conversationService: ConversationService,
    private agencyService: AgencyService,
    private shareService: SharedService,
    private maintenanceService: MaintenanceRequestService,
    private toastService: ToastrService,
    private taskService: TaskService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    this.handleGetInvoice(changes['show']?.currentValue);
  }

  handleGetInvoice(change: boolean) {
    if (!change) return;
    if (this.show) {
      this.conversationService
        .getInvoice(this.taskService.currentTask$.value?.id)
        .pipe(takeUntil(this.subscribe))
        .subscribe(
          (res) => {
            if (res) {
              this.invoiceFile = {
                ...this.invoiceFile,
                fileUrl: res.pdfUrl,
                fileName: res.pdfName,
                fileType: 'application/pdf'
              };
              const {
                creditor,
                jobTitle,
                invoiceDescription,
                gstAmount,
                totalAmount
              } = res;
              let { dueDate } = res;
              dueDate = dayjs(dueDate).format('YYYY-MM-DD');
              this.invoiceInformation.patchValue({
                creditor,
                jobTitle,
                invoiceDescription,
                dueDate,
                gstAmount: Number.parseInt(
                  this.shareService.removeCommaInNumber(gstAmount)
                ),
                amountExcludingGST: Number.parseInt(
                  this.shareService.removeCommaInNumber(totalAmount)
                )
              });
            } else {
              this.close();
            }
          },
          (error) => {
            this.close();
          }
        );
    } else {
      this.subscribe.next();
      this.subscribe.complete();
    }
  }

  ngOnInit(): void {
    this.invoiceInformation = new FormGroup({
      creditor: new FormControl(null, [Validators.required]),
      jobTitle: new FormControl('', [Validators.required]),
      invoiceDescription: new FormControl('', [
        Validators.required,
        Validators.maxLength(255)
      ]),
      dueDate: new FormControl('', [Validators.required]),
      amountExcludingGST: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      gstAmount: new FormControl('', [Validators.required, Validators.min(0)]),
      isSendFile: new FormControl(true)
    });
  }

  close() {
    this.onClose.emit(true);
  }

  syncToPropertyTree() {
    if (!this.invoiceInformation.valid) {
      return;
    }
    const supplierID = this.maintenanceService.maintenanceRequestResponse
      .getValue()
      ?.data[0].variable.receivers.find(
        (item) =>
          item?.type === EUserPropertyType.SUPPLIER &&
          item?.action === ForwardButtonAction.createWorkOrder
      )?.id;
    const body = {
      taskId: this.taskService.currentTask$.value?.id,
      agencyId: this.taskService.currentTask$.getValue()?.agencyId,
      supplierId: supplierID,
      detail: {
        ...this.invoiceFile,
        jobTitle: this.jobTitle.value,
        invoiceDescription: this.invoiceDescription.value,
        amount: +this.amountExcludingGST.value,
        dueDate: dayjs(this.dueDate.value).format('YYYY-MM-DD'),
        jobDescription: this.invoiceDescription.value,
        gstAmount: +this.gstAmount.value
      },
      isSendFile: this.isSendFile.value
    };
    this.conversationService
      .createInvoice(body)
      .pipe(
        takeUntil(this.subscribe),
        catchError((err) => {
          if (err.error.message) {
            this.conversationService.statusSyncInvoice.next(
              this.TYPE_SYNC_MAINTENANCE.FAILED
            );
            this.toastService.error(UNABLE_SYNC_PROPERTY_TREE);
          }
          return of(err);
        })
      )
      .subscribe(
        (res) => {
          this.conversationService.statusSyncInvoice.next(res.syncStatus);
          // this.controlPanelService.reloadForwardRequestList.next(res.data[0].body.button);
          this.close();
        },
        (err) => {
          this.close();
        }
      );
  }

  onCheckboxChange(event) {
    this.isSendFile.setValue(event);
  }

  get creditor() {
    return this.invoiceInformation.get('creditor');
  }

  get jobTitle() {
    return this.invoiceInformation.get('jobTitle');
  }

  get invoiceDescription() {
    return this.invoiceInformation.get('invoiceDescription');
  }

  get dueDate() {
    return this.invoiceInformation.get('dueDate');
  }

  get amountExcludingGST() {
    return this.invoiceInformation.get('amountExcludingGST');
  }

  get gstAmount() {
    return this.invoiceInformation.get('gstAmount');
  }

  get isSendFile() {
    return this.invoiceInformation.get('isSendFile');
  }

  ngOnDestroy() {
    this.subscribe.next();
    this.subscribe.complete();
    this.conversationService.statusSyncInvoice.next(null);
  }
}
