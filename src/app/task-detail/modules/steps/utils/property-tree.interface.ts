import { TrudiButtonEnumStatus } from '@shared/enum/trudiButton.enum';
import {
  EButtonAction,
  EPropertyTreeButtonComponent,
  ERentManagerAction,
  ERentManagerButtonComponent
} from './property-tree.enum';

export interface IUpdateStatus {
  id?: string;
  status: TrudiButtonEnumStatus;
  componentType: EPropertyTreeButtonComponent | ERentManagerButtonComponent;
  action: EButtonAction | ERentManagerAction;
  widgetId?: string;
}
