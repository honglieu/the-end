/* eslint-disable @angular-eslint/no-output-native */
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { IRadioButton } from '@trudi-ui';
import { Subject, takeUntil } from 'rxjs';
import {
  ICategoryItem,
  IDataPopupCompliance
} from '@/app/compliance/utils/compliance.type';
import {
  ESelectOpenComplianceItemPopup,
  ESelectRadioComplianceItemPopup
} from '@/app/compliance/utils/compliance.enum';
import { ComplianceService } from '@/app/compliance/services/compliance.service';
import { Compliance } from '@shared/types/compliance.interface';
import { WidgetPTService } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/services/widget-property.service';
import { PTWidgetDataField } from '@/app/task-detail/modules/sidebar-right/components/widget-property-tree/interface/widget-property-tree/widget-property-tree.interface';
import {
  EPropertyTreeType,
  ESyncStatus
} from '@/app/task-detail/utils/functions';
import { PreventButtonService } from '@trudi-ui';
import { EButtonStepKey, EButtonType } from '@trudi-ui';

const radioOptions: IRadioButton[] = [
  {
    value: ESelectRadioComplianceItemPopup.CREATE_NEW,
    label: 'Create new compliance item'
  },
  {
    value: ESelectRadioComplianceItemPopup.SELECT_EXISTING,
    label: 'Select existing compliance item'
  }
];

@Component({
  selector: 'create-select-update-compliance-popup',
  templateUrl: './create-select-update-compliance-popup.component.html',
  styleUrls: ['./create-select-update-compliance-popup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateSelectUpdateCompliancePopupComponent
  implements OnInit, OnDestroy
{
  @Input() complianceItems: ICategoryItem[];
  @Output() clickNext: EventEmitter<IDataPopupCompliance> =
    new EventEmitter<IDataPopupCompliance>();
  @Output() close = new EventEmitter();
  @Output() getListCompliance = new EventEmitter();
  public typePopup: EPropertyTreeType;
  public readonly selectRadio = ESelectRadioComplianceItemPopup;
  public readonly selectOpenPopup = ESelectOpenComplianceItemPopup;
  public selectedComplianceItem: ICategoryItem | Compliance;
  public radioOptions: IRadioButton[] = radioOptions;
  public selectedRadio: ESelectRadioComplianceItemPopup =
    ESelectRadioComplianceItemPopup.CREATE_NEW;
  private unsubscribe = new Subject<void>();
  public isNullSelect: boolean = false;
  public buttonKey = EButtonStepKey.COMPLIANCE;

  constructor(
    private _complianceService: ComplianceService,
    private widgetPTService: WidgetPTService,
    private PreventButtonService: PreventButtonService
  ) {}

  ngOnInit(): void {
    this.widgetPTService
      .getPopupWidgetState()
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        switch (res) {
          case EPropertyTreeType.CREATE_COMPLIANCE:
            this.typePopup = res;
            this.getListCompliance.emit();
            break;
          case EPropertyTreeType.UPDATE_COMPLIANCE:
            this.typePopup = res;
            this.getListUpdateComplianceItems();
            break;
          default:
            this.typePopup = null;
        }
      });
  }

  public changeSelectOption(select: ICategoryItem | Compliance) {
    this.isNullSelect = false;
    this.selectedComplianceItem = select;
  }

  public changeRadioOption(select: ESelectRadioComplianceItemPopup) {
    this.selectedRadio = select;
    if (this.selectedRadio === ESelectRadioComplianceItemPopup.CREATE_NEW) {
      this.selectedComplianceItem = null;
      this.isNullSelect = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { complianceItems } = changes || {};
    this.complianceItems =
      complianceItems?.currentValue ?? this.complianceItems;
    this.complianceItems = this.complianceItems
      ?.filter((item) => item.compliance)
      ?.map((item) => ({ ...item, label: item.name }));
  }

  private getListUpdateComplianceItems() {
    this.widgetPTService
      .getPTWidgetStateByType<Compliance[]>(PTWidgetDataField.COMPLIANCES)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((items) => {
        if (items) {
          this.complianceItems = items
            .filter(
              (item) =>
                item.id &&
                item?.syncStatus !== ESyncStatus.INPROGRESS &&
                item?.status === 'OPENED'
            )
            .map((item) => ({
              ...item,
              label: item.complianceCategory?.name
            }));
          this.setDefaultSelectOption();
        }
      });
  }

  private setDefaultSelectOption() {
    if (this.complianceItems?.length === 1) {
      this.selectedComplianceItem = this.complianceItems[0];
    }
  }

  public onNext() {
    if (
      (this.typePopup === EPropertyTreeType.CREATE_COMPLIANCE &&
        this.selectedRadio === ESelectRadioComplianceItemPopup.CREATE_NEW) ||
      this.selectedComplianceItem
    ) {
      this.isNullSelect = false;
      const dataEmit = {
        selectedComplianceItem: this.selectedComplianceItem,
        typePopup: this.typePopup
      };
      this.clickNext.emit(dataEmit);
    } else {
      this.isNullSelect = true;
    }
  }

  public onBlurSelectOption() {
    this.isNullSelect = !this.selectedComplianceItem;
  }

  public onFocusSelectOption() {
    this.isNullSelect = false;
  }

  public closePopup() {
    this._complianceService.showPopup$.next(null);
    this.close.emit();
    this.resetPopup();
    this.widgetPTService.setPopupWidgetState(null);
    this.PreventButtonService.deleteProcess(this.buttonKey, EButtonType.STEP);
  }

  private resetPopup() {
    this.selectedRadio = ESelectRadioComplianceItemPopup.CREATE_NEW;
    this.selectedComplianceItem = null;
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
