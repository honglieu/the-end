import { EMAIL_PATTERN } from '@services/constants';
import { EUserPropertyType } from '@shared/enum';
import { SUFFIX_INVALID_EMAIL_ID } from '@/app/trudi-send-msg/components/trudi-bulk-send-msg-container/trudi-bulk-send-msg-left/bulk-send-to/bulk-send-to.service';
import { TrudiSendMsgUserService } from '@/app/trudi-send-msg/services/trudi-send-msg-user.service';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SelectReceiverComponent } from '@shared/components/select-receiver/select-receiver/select-receiver.component';
import { ITasksForPrefillDynamicData } from '@/app/dashboard/modules/task-page/interfaces/task.interface';

@Component({
  selector: 'select-contact-type',
  templateUrl: './select-contact-type.component.html',
  styleUrl: './select-contact-type.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectContactTypeComponent
  implements OnInit, OnDestroy, OnChanges
{
  @ViewChild('selectReceiver', { static: false })
  selectReceiver: SelectReceiverComponent<any>;

  @Input() configs: ISendMsgConfigs = defaultConfigs;
  @Input() bindLabel: string = 'label';
  @Input() bindValue: string = 'id';
  @Input() control!: FormControl;
  @Input() prefixTemplate: string = 'To';
  @Input() suffixTemplate: TemplateRef<string> = null;
  @Input() placeholder: string;
  @Input() items = [];
  @Input() selectedTasks: ITasksForPrefillDynamicData[] = [];
  @Input() suffixPaddingLeft: string = '30px';
  @Input() appendTo = '';

  @Output() removeItem = new EventEmitter();

  private destroy$ = new Subject<void>();
  selectedContactTypeIds = [];
  listContactTypes = [];
  isFocused = false;
  EUserPropertyType = EUserPropertyType;
  isAddingTag: boolean = false;
  defaultItems = [];
  externalEmails = [];

  handleSearch = ({ search }) => {
    this.items = this.listContactTypes.filter((val) => {
      return this.searchBulkSendToFn(search, val);
    });
  };

  searchBulkSendToFn = (searchTerm: string, item) => {
    const searchTermLowerCase = searchTerm.trim().toLowerCase();
    const labelLowerCase = item.label.toLowerCase();
    return (
      item.type !== EUserPropertyType.UNIDENTIFIED &&
      labelLowerCase.includes(searchTermLowerCase)
    );
  };

  constructor(public trudiSendMsgUserService: TrudiSendMsgUserService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'].currentValue) {
      this.defaultItems = this.items;
      this.selectedContactTypeIds =
        this.control.value.filter((item) => !EMAIL_PATTERN.test(item)) || [];
      this.externalEmails = this.control.value
        .filter((item) => EMAIL_PATTERN.test(item))
        .map((externalEmail) => this.addEmail(externalEmail));
      this.listContactTypes = [
        ...this.items.filter(
          (item) => item?.type !== EUserPropertyType.UNIDENTIFIED
        )
      ];
      this.handleEventChange();
    }
  }

  ngOnInit(): void {
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedContactTypeIds = (this.control.value || [])?.filter(
        (selectedContactTypeId: string) =>
          this.listContactTypes.find((item) => selectedContactTypeId == item.id)
      );
    });
  }

  addEmail = (label) => {
    label = label.replaceAll(/\s/g, '').trim();
    const emailPattern = EMAIL_PATTERN;
    const isInvalid = !emailPattern.test(label);
    const uniqId = !isInvalid ? label : label + SUFFIX_INVALID_EMAIL_ID;
    this.isAddingTag = true;
    return {
      id: uniqId,
      email: label,
      label,
      isInvalid,
      type: EUserPropertyType.UNIDENTIFIED,
      subLabel: null,
      data: !isInvalid
        ? this.selectedTasks.map((task) => ({
            ...task,
            id: label,
            email: label,
            isInvalid,
            propertyId: task.property?.id,
            isFromSelectRecipients: true,
            type: EUserPropertyType.UNIDENTIFIED
          }))
        : []
    };
  };

  handleAddTag = (data) => {
    if (data?.type !== EUserPropertyType.UNIDENTIFIED) return;
    const isInListExternalEmails = this.externalEmails?.find(
      (item) => item.id === data.id
    );
    if (!this.externalEmails.length || !isInListExternalEmails) {
      this.externalEmails.push(data);
      this.handleEventChange();
      this.control.setValue(Array.from(new Set(this.control?.value)));
    }
  };

  handleRemoveItem = (itemRemove) => {
    if (itemRemove?.type !== EUserPropertyType.UNIDENTIFIED) return;
    this.items = this.items?.filter((item) => item.id !== itemRemove.id);
    this.externalEmails = this.externalEmails?.filter(
      (item) => item.id !== itemRemove.id
    );
    this.control.setValue(
      this.control?.value.filter((item) => item !== itemRemove.id)
    );
  };

  onFocusAndOpenSelect() {
    this.selectReceiver.onFocusAndOpenSelect();
  }

  focusAndBlur() {
    this.selectReceiver.focusAndBlur();
  }

  handleFocus(isFocused) {
    this.isFocused = isFocused;
  }

  handleClearSelection() {
    this.control.setValue([...this.externalEmails?.map((item) => item.id)]);
    this.handleEventChange();
  }

  handleEventChange = () => {
    this.items = [...this.defaultItems, ...this.externalEmails];
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
