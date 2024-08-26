import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {
  ConflictStepType,
  EContactCardType,
  EStatusStep,
  EStepAction,
  EStepType,
  ETypeElement
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';
import uuid4 from 'uuid4';
import {
  IApplicationShortlist,
  IBounceEvent,
  IBreakLeaseFee,
  ICalendarEvent,
  ICaptureAmountOwingVacate,
  ICaptureLeaseTerms,
  ICapturePetBond,
  ICommunicationStep,
  IEntryReport,
  IInspectionAction,
  IReminderTime,
  INoticeToLeave
} from '@/app/dashboard/modules/task-editor/modules/task-template-details/interfaces/template-tree.interface';
import { EReminderDateValue, EReminderTimelineValue } from '@trudi-ui';
import { cloneDeep } from 'lodash-es';
import { BehaviorSubject, Subject } from 'rxjs';
import { IFile } from '@shared/types/file.interface';
import { hasInvalidEmail } from '@shared/components/select-receiver/utils/helper.function';
import * as HTMLParser from 'node-html-parser';
import {
  CUSTOMIZE_FONT_STYLE_CLASS,
  defaultFontFamily,
  defaultFontSize
} from '@shared/components/tiny-editor/utils/font-utils';

const DEFAULT_REMINDER_STEP_TIME = '08:00 am';
const DEFAULT_EMAIL_TITLE = '{task_name} - {short_property_address}';

@Injectable({
  providedIn: 'root'
})
export class CommunicationStepFormService {
  private communicationForm: FormGroup;
  private readonly CUSTOM_FORM_FIELD: string = 'customControl';
  private selectedStep: ICommunicationStep;
  private customControlPreFill = null;
  public isSubmittedCommunicationForm = false;
  public isSubmittedAiGenerateMsgCopyForm = false;
  public fileAttach: BehaviorSubject<
    { icon: string; '0': IFile[] }[] | IFile[]
  > = new BehaviorSubject([]);
  public isDisabledAddStep: Subject<boolean> = new Subject();
  constructor(private formBuilder: FormBuilder) {}

  public buildForm() {
    const selectedStep = this.selectedStep
      ? this.handleCrmConflict(cloneDeep(this.selectedStep))
      : this.selectedStep;
    const { title, action, fields } = selectedStep || {};
    this.communicationForm = this.formBuilder.group({
      stepName: new FormControl(title || null, Validators.required),
      stepType: new FormControl(
        action || EStepAction.SEND_BASIC_EMAIL,
        Validators.required
      ),
      typeSend: new FormControl(fields?.typeSend || null, Validators.required),
      sendTo: new FormControl(fields?.sendTo || [], this.validateSendField()),
      sendCc: new FormControl(fields?.sendCc || [], this.validateSendField()),
      sendBcc: new FormControl(fields?.sendBcc || [], this.validateSendField()),
      emailTitle: new FormControl(
        fields?.msgTitle || DEFAULT_EMAIL_TITLE,
        Validators.required
      ),
      files: new FormControl(fields?.files || [])
    });

    this.addMessageCopyControl(
      this.checkAndWrapDefaultFontStyle(this.selectedStep?.fields?.msgBody)
    );

    if (selectedStep) {
      this.customControlPreFill = selectedStep?.fields?.customControl;
      this.addCustomControlByType(this.selectedStep.action);
    }
  }

  validateSendField(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const valuesSendField = control?.value || [];

      if (hasInvalidEmail(valuesSendField)) {
        return { emailInvalid: true };
      }
      return null;
    };
  }

  private handleCrmConflict(selectedStep: ICommunicationStep) {
    const { fields, crmConflictErrors = [] } = selectedStep || {};
    if (crmConflictErrors.find((x) => x.type === ConflictStepType.SEND_TO)) {
      fields.sendTo = [];
    }
    switch (selectedStep.action) {
      case EStepAction.SEND_CALENDAR_EVENT:
        if (crmConflictErrors.find((x) => x.type === ConflictStepType.EVENT)) {
          (fields.customControl as ICalendarEvent).event = null;
        }
        break;
      case EStepAction.SEND_CONTACT_CARD:
        if (
          crmConflictErrors.find(
            (x) => x.type === ConflictStepType.CONTACT_TYPE
          )
        ) {
          fields.customControl.contactData = [];
        }
        break;
      default:
        break;
    }

    return selectedStep;
  }

  public get getCommunicationForm(): FormGroup {
    return this.communicationForm;
  }

  public getValues(): ICommunicationStep {
    let { customControl } = this.communicationForm.getRawValue() || '';
    switch (this.communicationForm.get('stepType').value) {
      case EStepAction.CAPTURE_LEASE_TERMS:
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title']
          },
          leaseDuration: {
            leasePeriod: customControl['leasePeriod'],
            periodType: customControl['periodType']
          },
          rentalAmount: {
            rentedAt: customControl['rentedAt'],
            rentAmount: customControl['rentAmount'],
            frequency: customControl['frequency']
          },
          bond: {
            bondAt: customControl['bondAt'],
            bondAmount: customControl['bondAmount']
          },
          bondIncreaseAmount: customControl['bondIncreaseAmount']
        };
        break;
      case EStepAction.BOND_AMOUNT_DUE: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title'],
            amount: customControl['amount']
          },
          attachment: {
            attachmentIsRequired: customControl['attachmentIsRequired'],
            attachmentName: customControl['attachmentName']
          }
        };
        break;
      }
      case EStepAction.ENTRY_REPORT_DEADLINE: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title'],
            time: customControl['time']
          },
          attachment: {
            attachmentIsRequired: customControl['attachmentIsRequired'],
            attachmentName: customControl['attachmentName']
          }
        };
        break;
      }
      case EStepAction.CAPTURE_PET_BOND: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title'],
            amount: customControl['amount']
          }
        };
        break;
      }
      case EStepAction.CAPTURE_BREAK_LEASE_FEES: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title'],
            breakLeaseFee: customControl['breakLeaseFee'],
            advertisingFee: customControl['advertisingFee'],
            otherFee: {
              name: customControl['otherFee']['name'],
              fee: customControl['otherFee']['fee']
            }
          },
          attachment: {
            attachmentIsRequired: customControl['attachmentIsRequired'],
            attachmentName: customControl['attachmentName']
          }
        };
        break;
      }
      case EStepAction.CAPTURE_INSPECTION_ACTIONS: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title'],
            tenantNote: customControl['tenantNote'],
            tenantAction: customControl['tenantAction'],
            landlordNote: customControl['landlordNote'],
            landlordFollowUp: customControl['landlordFollowUp']
          },
          attachment: {
            attachmentIsRequired: customControl['attachmentIsRequired'],
            attachmentName: customControl['attachmentName']
          }
        };
        break;
      }
      case EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            tenancy: customControl['tenancy'],
            title: customControl['title'],
            rentOwing: customControl['rentOwing'],
            invoiceFees: customControl['invoiceFees'],
            notes: customControl['notes']
          }
        };
        break;
      }
      case EStepAction.NOTICE_TO_LEAVE: {
        customControl = {
          preScreen: {
            preScreenIsRequired: customControl['preScreenIsRequired'],
            title: customControl['title'],
            notice: customControl['notice'],
            beforeDate: customControl['beforeDate']
          },
          attachment: {
            attachmentIsRequired: customControl['attachmentIsRequired'],
            attachmentName: customControl['attachmentName']
          }
        };
        break;
      }
    }
    const files = this.fileAttach.getValue();
    const payload: ICommunicationStep = {
      key: uuid4(),
      title: this.communicationForm.get('stepName').value,
      type: ETypeElement.STEP,
      stepType: EStepType.COMMUNICATE,
      action: this.communicationForm.get('stepType').value,
      status: EStatusStep.PENDING,
      reminderTimes: [],
      fields: {
        typeSend: this.communicationForm.get('typeSend').value,
        sendTo: this.communicationForm.get('sendTo').value,
        sendCc: this.communicationForm.get('sendCc').value,
        sendBcc: this.communicationForm.get('sendBcc').value,
        msgTitle: this.communicationForm.get('emailTitle').value,
        msgBody: this.communicationForm?.get('messageCopy')?.value ?? '',
        customControl,
        files: files
      }
    };
    return payload;
  }

  public setSelectedStep(value) {
    this.selectedStep = value;
  }

  public getSelectedStep() {
    return this.selectedStep;
  }

  getEditingNode() {
    const newNode = {
      ...this.getValues(),
      key: this.selectedStep.key
    };
    return newNode;
  }

  public addCustomControlByType(stepType: EStepAction) {
    let controlToCreate: FormGroup | FormControl | FormArray = null;
    switch (stepType) {
      case EStepAction.SEND_CALENDAR_EVENT: {
        const customControl = this.customControlPreFill || {
          event: null,
          isRequired: true
        };
        controlToCreate = this.buildFormCalendarEvent(customControl);
        break;
      }
      case EStepAction.SEND_ATTACHMENT: {
        const customControl = this.customControlPreFill || {
          attachmentName: '',
          isRequired: true
        };
        controlToCreate = this.buildSendAttachmentForm(customControl);
        break;
      }
      case EStepAction.SCHEDULE_REMINDER: {
        const customControl = this.customControlPreFill || {
          reminderTime: DEFAULT_REMINDER_STEP_TIME,
          day: EReminderDateValue.day1,
          timeline: EReminderTimelineValue.before,
          event: null
        };
        controlToCreate = this.buildScheduleReminderForm(customControl);
        break;
      }
      case EStepAction.SEND_CONTACT_CARD: {
        const customControl = this.customControlPreFill || {
          contactCardType: EContactCardType.INDIVIDUAL_SUPPLIER,
          crmSystemId: null,
          contactData: [],
          isRequired: true
        };
        controlToCreate = this.buildSendContactCardForm(customControl);
        break;
      }
      case EStepAction.SEND_CONVERSATION_FILES: {
        const customControl = this.customControlPreFill || {
          file: '',
          isRequired: true
        };
        controlToCreate = this.buildSendConversationFileForm(customControl);
        break;
      }
      case EStepAction.CAPTURE_LEASE_TERMS: {
        const customControl: ICaptureLeaseTerms = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'What lease term has the owner approved?'
          },
          leaseDuration: {
            leasePeriod: null,
            periodType: null
          },
          rentalAmount: {
            rentedAt: null,
            rentAmount: null,
            frequency: null
          },
          bond: {
            bondAt: null,
            bondAmount: null
          },
          bondIncreaseAmount: null
        };
        controlToCreate = this.buildCaptureLeaseTerms(customControl);
        break;
      }
      case EStepAction.BOND_AMOUNT_DUE: {
        const customControl: IBounceEvent = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'Confirm bond',
            amount: null
          },
          attachment: {
            attachmentIsRequired: true,
            attachmentName: ''
          }
        };
        controlToCreate = this.buildBounceEventForm(customControl);
        break;
      }
      case EStepAction.ENTRY_REPORT_DEADLINE: {
        const customControl: IEntryReport = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'When must the tenant return the Entry condition report?',
            time: null
          },
          attachment: {
            attachmentIsRequired: true,
            attachmentName: ''
          }
        };
        controlToCreate = this.buildEntryReportForm(customControl);
        break;
      }
      case EStepAction.BOND_RETURN_SUMMARY: {
        const customControl = this.customControlPreFill || {
          bondTitle: 'Bond return summary',
          bondTenant: null,
          bondDeduct: null,
          reasonDeduct: null,
          isRequired: true
        };
        controlToCreate = this.buildBondReturnSummaryForm(customControl);
        break;
      }
      case EStepAction.CAPTURE_AMOUNT_OWING_TO_VACATE: {
        const customControl: ICaptureAmountOwingVacate = this
          .customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'Amount owing to vacate',
            tenancy: null,
            rentOwing: null,
            invoiceFees: null,
            notes: null
          }
        };
        controlToCreate =
          this.buildCaptureAmountOwingToVacateForm(customControl);
        break;
      }
      case EStepAction.LETTING_RECOMMENDATIONS: {
        const customControl = this.customControlPreFill || {
          isRequired: true,
          lettingTitle: 'Send owner reletting recommendations',
          type: null,
          amount: null,
          paymentPeriod: null,
          period: null,
          periodType: null
        };
        controlToCreate = this.buildLettingRecommendation(customControl);
        break;
      }
      case EStepAction.CAPTURE_PET_BOND:
        const customControl: ICapturePetBond = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'Will a pet bond be required?',
            amount: null
          }
        };
        controlToCreate = this.buildCapturePetBondForm(customControl);
        break;
      case EStepAction.CAPTURE_CONDITIONS_FOR_REQUEST_APPROVAL: {
        const customControl = this.customControlPreFill || {
          title: 'Are there any conditions for the approval?',
          isRequired: true
        };
        controlToCreate =
          this.buildCaptureConditionsForRequestApprovalForm(customControl);
        break;
      }
      case EStepAction.CAPTURE_BREAK_LEASE_FEES: {
        const customControl: IBreakLeaseFee = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'To break their lease, what fees must the tenant pay?',
            breakLeaseFee: null,
            advertisingFee: null,
            otherFee: {
              name: '',
              fee: null
            }
          },
          attachment: { attachmentIsRequired: true, attachmentName: '' }
        };
        controlToCreate = this.buildCaptureBreakLeaseFee(customControl);
        break;
      }
      case EStepAction.CAPTURE_INSPECTION_ACTIONS: {
        const customControl: IInspectionAction = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'Add inspection notes or action items?',
            tenantNote: '',
            tenantAction: '',
            landlordNote: '',
            landlordFollowUp: ''
          },
          attachment: { attachmentIsRequired: true, attachmentName: '' }
        };
        controlToCreate = this.buildCaptureInspectionAction(customControl);
        break;
      }
      case EStepAction.APPLICATIONS_SHORTLIST: {
        const customControl: IApplicationShortlist = this
          .customControlPreFill || {
          preScreenIsRequired: true,
          title: 'Shortlisted applications',
          applicationName1: null,
          applicationSummary1: null,
          applicationName2: null,
          applicationSummary2: null,
          applicationName3: null,
          applicationSummary3: null
        };
        controlToCreate = this.buildApplicationForm(customControl);
        break;
      }
      case EStepAction.NOTICE_TO_LEAVE: {
        const customControl: INoticeToLeave = this.customControlPreFill || {
          preScreen: {
            preScreenIsRequired: true,
            title: 'Leave notice detail',
            notice: null,
            beforeDate: null
          },
          attachment: {
            attachmentIsRequired: false,
            attachmentName: ''
          }
        };
        controlToCreate = this.buildNoticeToLeaveForm(customControl);
        break;
      }
      default: {
        this.communicationForm.removeControl(this.CUSTOM_FORM_FIELD);
        break;
      }
    }
    if (!!controlToCreate) {
      this.communicationForm.setControl(
        this.CUSTOM_FORM_FIELD,
        controlToCreate
      );
    }
  }

  public resetCustomForm(): void {
    this.customControlPreFill = null;
  }

  public addMessageCopyControl(message?: string) {
    this.communicationForm.addControl(
      'messageCopy',
      new FormControl(message || '', [
        Validators.required,
        this.customValidateMsgContent()
      ])
    );
  }

  public removeControl(controlName: string) {
    this.communicationForm.removeControl(controlName);
  }

  public get getCustomForm(): AbstractControl {
    return this.communicationForm.controls['customControl'];
  }

  private buildFormCalendarEvent({
    event,
    isRequired
  }: ICalendarEvent): FormGroup {
    return this.formBuilder.group({
      event: new FormControl(event, Validators.required),
      isRequired: new FormControl({ value: isRequired, disabled: true })
    });
  }

  private buildSendAttachmentForm({ attachmentName, isRequired }) {
    return this.formBuilder.group({
      attachmentName: new FormControl(attachmentName, Validators.required),
      isRequired: new FormControl(isRequired)
    });
  }

  private buildScheduleReminderForm({
    reminderTime,
    day,
    timeline,
    event
  }: IReminderTime) {
    return this.formBuilder.group({
      reminderTime: new FormControl(reminderTime, Validators.required),
      day: new FormControl(day, Validators.required),
      timeline: new FormControl(timeline, Validators.required),
      event: new FormControl(event, Validators.required)
    });
  }

  private buildSendContactCardForm({
    contactCardType,
    contactData,
    isRequired,
    crmSystemId
  }) {
    return this.formBuilder.group({
      contactCardType: new FormControl(contactCardType, Validators.required),
      contactData: new FormControl(contactData, Validators.required),
      isRequired: new FormControl({ value: isRequired, disabled: true }),
      crmSystemId: new FormControl({ value: crmSystemId })
    });
  }

  private buildBondReturnSummaryForm({
    bondTitle,
    bondTenant,
    bondDeduct,
    reasonDeduct,
    isRequired
  }) {
    return this.formBuilder.group({
      bondTitle: new FormControl(bondTitle, Validators.required),
      bondTenant: new FormControl({ value: bondTenant, disabled: true }),
      bondDeduct: new FormControl({ value: bondDeduct, disabled: true }),
      reasonDeduct: new FormControl({ value: reasonDeduct, disabled: true }),
      isRequired: new FormControl(isRequired)
    });
  }

  private buildSendConversationFileForm({ file, isRequired }) {
    return this.formBuilder.group({
      file: new FormControl(file, Validators.required),
      isRequired: new FormControl(isRequired)
    });
  }

  private buildBounceEventForm({
    preScreen: { preScreenIsRequired, title, amount },
    attachment: { attachmentIsRequired, attachmentName }
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      attachmentIsRequired: new FormControl(attachmentIsRequired),
      title: new FormControl(title, Validators.required),
      amount: new FormControl({ value: amount, disabled: true }),
      attachmentName: new FormControl(attachmentName, Validators.required)
    });
  }

  private buildCaptureLeaseTerms({
    preScreen: { preScreenIsRequired, title },
    leaseDuration: { leasePeriod, periodType },
    rentalAmount: { rentedAt, rentAmount, frequency },
    bond: { bondAt, bondAmount },
    bondIncreaseAmount
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      title: new FormControl(title, Validators.required),
      leasePeriod: new FormControl({ value: leasePeriod, disabled: true }),
      periodType: new FormControl({ value: periodType, disabled: true }),
      rentedAt: new FormControl({ value: rentedAt, disabled: true }),
      rentAmount: new FormControl({ value: rentAmount, disabled: true }),
      frequency: new FormControl({ value: frequency, disabled: true }),
      bondAt: new FormControl({ value: bondAt, disabled: true }),
      bondIncreaseAmount: new FormControl({
        value: bondIncreaseAmount,
        disabled: true
      }),
      bondAmount: new FormControl({ value: bondAmount, disabled: true }),
      isNotApplicable: new FormControl({ value: false, disabled: true })
    });
  }

  private buildEntryReportForm({
    preScreen: { preScreenIsRequired, title, time },
    attachment: { attachmentIsRequired, attachmentName }
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      attachmentIsRequired: new FormControl(attachmentIsRequired),
      title: new FormControl(title, Validators.required),
      time: new FormControl({ value: time, disabled: true }),
      attachmentName: new FormControl(attachmentName, Validators.required)
    });
  }

  private buildLettingRecommendation({
    isRequired,
    lettingTitle,
    type,
    amount,
    paymentPeriod,
    period,
    periodType
  }) {
    return this.formBuilder.group({
      lettingTitle: new FormControl(lettingTitle, Validators.required),
      type: new FormControl({ value: type, disabled: true }),
      amount: new FormControl({ value: amount, disabled: true }),
      paymentPeriod: new FormControl({ value: paymentPeriod, disabled: true }),
      period: new FormControl({ value: period, disabled: true }),
      periodType: new FormControl({ value: periodType, disabled: true }),
      isRequired: new FormControl(isRequired)
    });
  }

  private buildCapturePetBondForm({
    preScreen: { preScreenIsRequired, title, amount }
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      title: new FormControl(title, Validators.required),
      amount: new FormControl({ value: amount, disabled: true })
    });
  }

  private buildCaptureConditionsForRequestApprovalForm({ title, isRequired }) {
    return this.formBuilder.group({
      title: new FormControl(title, Validators.required),
      isRequired: new FormControl(isRequired),
      condition: new FormControl({ value: '', disabled: true })
    });
  }

  private buildCaptureBreakLeaseFee({
    preScreen: {
      preScreenIsRequired,
      title,
      breakLeaseFee,
      advertisingFee,
      otherFee: { name, fee }
    },
    attachment: { attachmentIsRequired, attachmentName }
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      title: new FormControl(title, Validators.required),
      breakLeaseFee: new FormControl({ value: breakLeaseFee, disabled: true }),
      advertisingFee: new FormControl({
        value: advertisingFee,
        disabled: true
      }),
      otherFee: new FormGroup({
        name: new FormControl({ value: name, disabled: true }),
        fee: new FormControl({ value: fee, disabled: true })
      }),
      attachmentIsRequired: new FormControl(attachmentIsRequired),
      attachmentName: new FormControl(attachmentName, Validators.required)
    });
  }

  private buildCaptureInspectionAction({
    preScreen: {
      preScreenIsRequired,
      title,
      tenantNote,
      tenantAction,
      landlordNote,
      landlordFollowUp
    },
    attachment: { attachmentIsRequired, attachmentName }
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      title: new FormControl(title, Validators.required),
      tenantNote: new FormControl({ value: tenantNote, disabled: true }),
      tenantAction: new FormControl({ value: tenantAction, disabled: true }),
      landlordNote: new FormControl({ value: landlordNote, disabled: true }),
      landlordFollowUp: new FormControl({
        value: landlordFollowUp,
        disabled: true
      }),
      attachmentIsRequired: new FormControl(attachmentIsRequired),
      attachmentName: new FormControl(attachmentName, Validators.required)
    });
  }

  private buildApplicationForm({
    preScreenIsRequired,
    title,
    applicationName1,
    applicationSummary1,
    applicationName2,
    applicationSummary2,
    applicationName3,
    applicationSummary3
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      title: new FormControl(title, Validators.required),
      applicationName1: new FormControl({
        value: applicationName1,
        disabled: true
      }),
      applicationSummary1: new FormControl({
        value: applicationSummary1,
        disabled: true
      }),
      applicationName2: new FormControl({
        value: applicationName2,
        disabled: true
      }),
      applicationSummary2: new FormControl({
        value: applicationSummary2,
        disabled: true
      }),
      applicationName3: new FormControl({
        value: applicationName3,
        disabled: true
      }),
      applicationSummary3: new FormControl({
        value: applicationSummary3,
        disabled: true
      })
    });
  }

  private buildCaptureAmountOwingToVacateForm({
    preScreen: {
      preScreenIsRequired,
      title,
      tenancy,
      rentOwing,
      invoiceFees,
      notes
    }
  }: ICaptureAmountOwingVacate) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      title: new FormControl(title, Validators.required),
      tenancy: new FormControl({ value: tenancy, disabled: true }),
      rentOwing: new FormControl({ value: rentOwing, disabled: true }),
      invoiceFees: new FormControl({ value: invoiceFees, disabled: true }),
      notes: new FormControl({ value: notes, disabled: true })
    });
  }

  private buildNoticeToLeaveForm({
    preScreen: { preScreenIsRequired, title, notice, beforeDate },
    attachment: { attachmentIsRequired, attachmentName }
  }) {
    return this.formBuilder.group({
      preScreenIsRequired: new FormControl(preScreenIsRequired),
      attachmentIsRequired: new FormControl(attachmentIsRequired),
      title: new FormControl(title, Validators.required),
      notice: new FormControl({ value: notice, disabled: true }),
      beforeDate: new FormControl({ value: beforeDate, disabled: true }),
      attachmentName: new FormControl(attachmentName, Validators.required)
    });
  }

  checkAndWrapDefaultFontStyle(content: string) {
    try {
      if (
        !content ||
        content.trim().length === 0 ||
        content === '<p>&nbsp;</p>'
      )
        return content;
      const rootEl = HTMLParser.parse(content);
      const wrapEl = rootEl?.querySelector(`.${CUSTOMIZE_FONT_STYLE_CLASS}`);
      if (wrapEl) {
        return content;
      } else {
        return `<div class="customize-font-style" style="font-family:${defaultFontFamily.format};font-size:${defaultFontSize.format};">${content}</div>`;
      }
    } catch (error) {
      console.warn('parse HTML to wrap custom style error: ', error);
    }

    return content;
  }

  customValidateMsgContent(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return { required: true };

      const isControlEmpty =
        !control.value?.length ||
        !control.value.trim().replaceAll('<p>&nbsp;</p>', '').length;

      if (isControlEmpty) {
        return { required: true };
      }

      return null;
    };
  }
}
