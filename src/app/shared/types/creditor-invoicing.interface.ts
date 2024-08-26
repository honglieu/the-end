import { CreditorInvoicingButtonAction } from '@shared/enum/creditor-invoicing.enum';
import { ETrudiType } from '@shared/enum/trudi';
import { EUserPropertyType } from '@shared/enum/user.enum';
import { TenancyInvoiceSyncJob } from './tenancy-invoicing.interface';
import { TrudiButtonBase } from './trudi.interface';

export interface CreditorInvoiceHeader {}

export interface CreditorInvoiceButton extends TrudiButtonBase {
  index: number;
  isFrozen?: boolean;
  isInvoice: boolean;
  textForward?: string;
}

export interface CreditorInvoiceData {
  step: number;
  syncJob: TenancyInvoiceSyncJob;
  isCompleted: boolean;
  header: CreditorInvoiceHeader;
  body: CreditorInvoiceBody;
}

export interface CreditorInvoicingRequestTrudiVariableReceiver {
  id: string;
  firstName: string;
  lastName: string;
  userPropertyType: EUserPropertyType;
  conversationId?: string;
  action?: CreditorInvoicingButtonAction;
  raiseBy?: string;
}

export interface CreditorInvoiceSetting {
  categoryId: string;
  taskNameId: string;
}

export interface CreditorInvoicingResponseInterface {
  type: ETrudiType;
  data: CreditorInvoiceData[];
  // variable: Variable;
  setting: CreditorInvoiceSetting;
  stepIndex: number;
  body?: CreditorInvoiceBody;
}

export interface CreditorInvoiceBody {
  button: CreditorInvoiceButton[];
  text?: string;
}
