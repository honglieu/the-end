import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { ISendMsgConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg.interface';
import { defaultConfigs } from '@/app/trudi-send-msg/utils/trudi-send-msg-config';
import { ECRMSystem } from '@/app/console-setting/agencies/utils/agencies-setting.enum';
import { AbstractControl, FormGroup } from '@angular/forms';
import { UserPropertyInPeople } from '@shared/types/user-property.interface';
import { Subject } from 'rxjs';
import { UploadFromCRMService } from '@shared/components/upload-from-crm/upload-from-crm.service';
import { CompanyService } from '@services/company.service';

@Component({
  selector: 'select-property-popup',
  templateUrl: './select-property-popup.component.html',
  styleUrls: ['./select-property-popup.component.scss']
})
export class SelectPropertyPopupComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() visible: boolean = false;
  @Input() configs: ISendMsgConfigs = cloneDeep(defaultConfigs);
  @Input() form: FormGroup;
  @Input() currentAgencyId: string = '';
  @Input() activeProperty: UserPropertyInPeople[] = [];
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onTrigger: EventEmitter<any> = new EventEmitter();
  public validatePropertyMsg = 'Required field';
  private destroy$ = new Subject<void>();
  public CRMSystemName = ECRMSystem;
  public currentCompanyCRMSystemName$ =
    this.companyService.currentCompanyCRMSystemName;
  isLoading: boolean = true;
  isSubmitted: boolean = false;
  defaultConfigs: ISendMsgConfigs = {
    ...defaultConfigs,
    header: {
      ...defaultConfigs.header,
      title: 'Select Property'
    }
  };
  searchText: string = '';

  get selectedPropertyId(): AbstractControl {
    return this.form?.get('property');
  }
  constructor(
    private uploadFromCRMService: UploadFromCRMService,
    private companyService: CompanyService
  ) {}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeProperty']?.currentValue) {
      if (this.activeProperty) {
        this.isLoading = false;
      }
    }
  }

  ngOnInit() {
    if (this.selectedPropertyId)
      this.setSelectPropertyValue(this.selectedPropertyId.value);
    this.selectedPropertyId.valueChanges.subscribe((value) => {
      this.setSelectPropertyValue(value);
    });
  }

  setSelectPropertyValue(value) {
    if (value) {
      const selectedProperty = this.activeProperty.find(
        (item) => item.id === value
      );
      this.searchText = selectedProperty.streetline;
    } else {
      this.searchText = '';
    }
  }

  onTriggerClick(isCheck: boolean) {
    if (isCheck) {
      this.isSubmitted = true;
      if (this.selectedPropertyId.invalid) {
        this.selectedPropertyId.markAllAsTouched();
        return;
      }

      this.uploadFromCRMService.setPopupState({
        visibleSelect: false,
        visibleAttachFile: true
      });

      const selectedProperty = this.activeProperty.find(
        (item) => item.id === this.selectedPropertyId.value
      );
      this.uploadFromCRMService.setSelectedProperty(selectedProperty);
    } else {
      this.form.reset();
      this.uploadFromCRMService.setSelectedProperty(null);
      this.uploadFromCRMService.setPopupState({
        visibleSelect: false
      });
      this.onTrigger.emit();
    }
    this.selectedPropertyId.markAsUntouched();
    this.selectedPropertyId.updateValueAndValidity();
  }

  handleSearch(event) {
    if (event !== '' && event?.term.trim() !== this.searchText.trim())
      this.searchText = event.term;
  }

  onCloseSendMsg() {
    this.form.reset();
    this.uploadFromCRMService.setSelectedProperty(null);
    this.onClose.emit();
  }
}
