import { TrudiSaveDraftService } from '@/app/trudi-send-msg/services/trudi-save-draft.service';
import { TrudiSendMsgFormService } from '@/app/trudi-send-msg/services/trudi-send-msg-form.service';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';

@Component({
  selector: 'trudi-send-msg-property',
  templateUrl: './trudi-send-msg-property.component.html',
  styleUrls: ['./trudi-send-msg-property.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TrudiSendMsgPropertyComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrudiSendMsgPropertyComponent
  implements OnInit, ControlValueAccessor
{
  @Input() isLoading: boolean = false;
  @Input() listProperties: UserPropertyInPeople[] = [];
  public currentProperty: UserPropertyInPeople = null;
  public currentPropertyId: string = '';
  public hasPrefillProperty: boolean = false;

  constructor(
    public cdr: ChangeDetectorRef,
    private trudiSendMsgFormService: TrudiSendMsgFormService,
    private trudiSaveDraftService: TrudiSaveDraftService
  ) {}

  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value): void {
    const valueChange = this.handleChangeValue(value);
    this.onChange(valueChange);
  }

  handleChangeValue(value) {
    if (value?.id) {
      return value;
    }
    this.currentProperty =
      this.listProperties.find((item) => item.id === value) ?? null;
    this.currentPropertyId = value;
    this.cdr.markForCheck();
    return this.currentProperty;
  }

  registerOnChange(fn: (value) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  ngOnInit(): void {
    this.currentPropertyId = this.trudiSendMsgFormService.property.value?.id;
    this.hasPrefillProperty = !!this.currentPropertyId;
    this.findPropertyId(this.currentPropertyId);
  }

  findPropertyId(propertyId: string) {
    this.currentProperty =
      this.listProperties.find((item) => item.id === propertyId) ?? null;
    this.writeValue(this.currentProperty);
  }

  onModelChange(propertyId) {
    if (this.hasPrefillProperty) {
      this.currentPropertyId =
        propertyId === this.trudiSendMsgFormService.property.value?.id
          ? null
          : propertyId;
      this.hasPrefillProperty = false;
    }
    this.findPropertyId(this.currentPropertyId);
  }

  handleOpenSelectDropdown($event) {
    this.trudiSendMsgFormService.triggerOpenDropdownProperties$.next($event);
  }

  handleSearchProperties($event) {
    this.trudiSendMsgFormService.valueSearchProperties$.next($event);
  }

  trackUserChange() {
    this.trudiSaveDraftService.setTrackControlChange('property', true);
  }
}
