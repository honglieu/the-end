import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, filter, switchMap, Subject } from 'rxjs';
import { conversations, users } from 'src/environments/environment';
import {
  DownloadSignedFormDetail,
  FormDetail,
  ReiForm,
  ReiFormData,
  ReiFormLink,
  ReiFormLinks,
  ReiFormWidget
} from '@shared/types/rei-form.interface';
import { RoutineInspectionResponseInterface } from '@shared/types/routine-inspection.interface';
import { LeaseRenewalRequestTrudiResponse } from '@shared/types/trudi.interface';
import { ApiService } from './api.service';
import { TaskService } from './task.service';
import { LeaseRenewalRequestButtonAction } from '@shared/enum/lease-renewal-Request.enum';
import { RoutineInspectionButtonAction } from '@shared/enum/routine-inspection.enum';
import { PetRequestButtonAction } from '@shared/enum/petRequest.enum';
import { ETenantVacateButtonAction } from '@/app/tenant-vacate/utils/tenantVacateType';
import { LeasingRequestButtonAction } from '@shared/enum/leasing-request.enum';
import { EStepAction } from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { CompanyService } from './company.service';

@Injectable({
  providedIn: 'root'
})
export class ReiFormService {
  public currentReiFormData$: BehaviorSubject<ReiFormData> =
    new BehaviorSubject(null);
  public createReiFormLink$: BehaviorSubject<ReiFormLinks> =
    new BehaviorSubject({
      outSide: [],
      inPopup: []
    });
  public updateReiFormData$: BehaviorSubject<FormDetail> = new BehaviorSubject(
    null
  );
  public popupReiForm = new BehaviorSubject({
    isShowREIFormPopup: false,
    showReviewAttachPopup: false
  });
  public reiFormLink: Subject<ReiFormLink> = new Subject();
  readonly listReiFormsBtn: string[] = [
    LeaseRenewalRequestButtonAction.askLandLordForIntentions,
    LeaseRenewalRequestButtonAction.createLeaseAgreementSendToTenants,
    RoutineInspectionButtonAction.SEND_ENTRY_NOTICE_TO_TENANT_SCHEDULED,
    RoutineInspectionButtonAction.SEND_A_REMINDER_TO_TENANT_RESCHEDULED,
    RoutineInspectionButtonAction.SEND_TENANT_INSPECTION_REPORT,
    RoutineInspectionButtonAction.SEND_LANDLORD_INSPECTION_REPORT,
    RoutineInspectionButtonAction.SEND_ENTRY_NOTICE_TO_TENANT_RESCHEDULED,
    PetRequestButtonAction.sendFormTenant,
    ETenantVacateButtonAction.sendTenantVacateInstructionsEndOfLease,
    ETenantVacateButtonAction.sendTenantVacateInstructionsBreakLease,
    ETenantVacateButtonAction.sendTenantVacateInstructionsNoticeToVacate,
    ETenantVacateButtonAction.requestTenantCompleteVacateFormEndOfLease,
    ETenantVacateButtonAction.requestTenantCompleteVacateFormBreakLease,
    ETenantVacateButtonAction.issueTenantVacateNotice,
    ETenantVacateButtonAction.sendTenantExitReportAndRequestRemedyOfIssues,
    ETenantVacateButtonAction.requestTenantCompleteVacateFormEndOfLease,
    ETenantVacateButtonAction.sendLandlordExitReport,
    LeasingRequestButtonAction.send_tenant_new_lease,
    LeasingRequestButtonAction.send_tenant_bond_lodgement_form,
    LeasingRequestButtonAction.send_tenant_entry_report_and_instructions,
    EStepAction.ENTRY_REPORT_DEADLINE,
    EStepAction.BOND_AMOUNT_DUE,
    EStepAction.NOTICE_TO_LEAVE,
    EStepAction.CAPTURE_BREAK_LEASE_FEES,
    EStepAction.CAPTURE_INSPECTION_ACTIONS,
    EStepAction.SEND_ATTACHMENT
  ];

  constructor(
    private apiService: ApiService,
    private agencyService: AgencyService,
    private taskService: TaskService,
    private companyService: CompanyService
  ) {}

  getListReiForm() {
    return this.apiService.getAPI(users, 'rei-form/get-option');
  }

  updateStateAndToken(body: any) {
    return this.apiService.putAPI(users, 'rei-form/update-rei-token', body);
  }

  updateAllListReiForm(taskId: string) {
    return this.apiService.postAPI(
      conversations,
      `rei-forms/refresh-all/${taskId}`,
      {
        taskId
      }
    );
  }

  setReiFormLink(value: ReiFormLink, popupState) {
    if (popupState?.addReiFormOutside) {
      this.createReiFormLink$.next({
        ...this.createReiFormLink$.value,
        outSide: [...this.createReiFormLink$.value?.outSide, value]
      });
    } else {
      this.createReiFormLink$.next({
        ...this.createReiFormLink$.value,
        inPopup: [...this.createReiFormLink$.value?.inPopup, value]
      });
    }
  }

  clearReiFormLinkPopUp() {
    this.createReiFormLink$.next({
      ...this.createReiFormLink$.value,
      inPopup: []
    });
  }

  clearReiFormLinkOutside() {
    this.createReiFormLink$.next({
      ...this.createReiFormLink$.value,
      outSide: []
    });
  }

  getReiForm(
    isTemplate: boolean,
    page: number = 1,
    name: string
  ): Observable<ReiForm[]> {
    return this.companyService.getCurrentCompany().pipe(
      filter((company) => !this.agencyService.isRentManagerCRM(company)),
      switchMap(() =>
        this.apiService.postAPI(
          conversations,
          `rei-form/get-all-form-template`,
          {
            isTemplate,
            page,
            name
          }
        )
      )
    );
  }

  uploadReiFormData(reiFormId: number): Observable<ReiFormData> {
    return this.apiService.getAPI(
      conversations,
      `rei-form/${reiFormId}/upload`
    );
  }

  updateReiFormData(
    action: string,
    formId: number
  ): Observable<LeaseRenewalRequestTrudiResponse> {
    const body = {
      formId,
      action,
      taskId: this.taskService.currentTaskId$.getValue(),
      agencyId: this.taskService.currentTask$.getValue()?.agencyId
    };
    return this.apiService.postAPI(
      conversations,
      'lease-renewal/refresh-data-rei-form',
      body
    );
  }

  updateInspectionReiFormData(
    action: string,
    formId: number
  ): Observable<RoutineInspectionResponseInterface> {
    const body = {
      formId,
      action,
      taskId: this.taskService.currentTaskId$.getValue(),
      agencyId: this.taskService.currentTask$.getValue()?.agencyId
    };
    return this.apiService.postAPI(
      conversations,
      'routine-inspection/refresh-data-rei-form',
      body
    );
  }
  downloadSignedReiFormDetail(
    reiFormId: number
  ): Observable<DownloadSignedFormDetail> {
    return this.apiService.getAPI(
      conversations,
      `rei-form/${reiFormId}/download`
    );
  }

  updateReiToken(reiToken): Observable<any> {
    return this.apiService.putAPI(users, 'update-rei-token', reiToken);
  }

  createLinkReiForm(formId: string, taskId?: string): Observable<ReiFormLink> {
    const body = {
      taskId: taskId || this.taskService.currentTaskId$.getValue(),
      formId
    };
    return this.apiService.postAPI(
      conversations,
      'rei-form/create-link-rei-form',
      body
    );
  }

  confirmCreateLinkReiForm(
    formIds: string[],
    taskId?: string,
    trudiButtonAction?: string
  ): Observable<ReiFormLink[]> {
    const body = {
      taskId: taskId || this.taskService.currentTaskId$.getValue(),
      formIds,
      trudiButtonAction
    };
    return this.apiService.postAPI(
      conversations,
      'rei-form/confirm-reiform',
      body
    );
  }

  createNewReiForm(body: {
    templateId: string;
    formName: string;
    isPrivate: boolean;
    eventId?: string;
    userTemlateId?: string;
  }): Observable<ReiFormLink> {
    return this.apiService.postAPI(
      conversations,
      'rei-form/create-new-rei-form',
      body
    );
  }

  updatePetRequestRefreshREIForm(taskId: string, action: string) {
    const body = {
      agencyId: this.taskService.currentTask$.getValue()?.agencyId,
      stepIndex: 0,
      taskId,
      action
    };
    return this.apiService.postAPI(
      conversations,
      'pet-request/refresh-rei-form',
      body
    );
  }

  updateReiformName(
    formName: string,
    agencyId: string,
    formId: number,
    taskId: string
  ) {
    return this.apiService.postAPI(conversations, 'rei-form/update-rei-form', {
      formName,
      agencyId,
      formId,
      taskId
    });
  }

  refreshTenantVacateREIForm(taskId: string, action: string) {
    return this.apiService.postAPI(
      conversations,
      'tenant-vacate/refresh-rei-form',
      { taskId, action }
    );
  }

  updateTenantVacateReiFormInfor(
    taskId: string,
    action: string,
    reiFormInfor: ReiFormData
  ) {
    return this.apiService.postAPI(
      conversations,
      'tenant-vacate/update-rei-form-info',
      { taskId, action, reiFormInfor }
    );
  }

  getFormsForWidget(taskId: string): Observable<ReiFormWidget[]> {
    return this.apiService.getAPI(conversations, `rei-forms/${taskId}`);
  }

  refreshFormWidget(
    taskId: string,
    formId: number
  ): Observable<{ diff: boolean; reiFormDetails: ReiFormWidget }> {
    return this.apiService.postAPI(
      conversations,
      `rei-forms/refresh/${taskId}/${formId}`,
      {}
    );
  }
}
