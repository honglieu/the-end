import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  EBadgeSetting,
  EBadgeSettingColor
} from '@/app/dashboard/modules/insights/enums/insights.enum';
import { DECIMAL_NUMBER } from '@services/constants';

@Component({
  selector: 'setting-option-item',
  templateUrl: './setting-option-item.component.html',
  styleUrls: ['./setting-option-item.component.scss']
})
export class SettingOptionItemComponent implements OnInit {
  constructor() {}
  @Input() unitOfMeasure: string = '';
  @Input() badge: string = '';
  @Input() settingQuestion: string = '';
  @Input() controlName: string;
  @Input() formGroup: FormGroup;
  @Input() checkSubmit: boolean;
  public EBadgeSetting = EBadgeSetting;
  public EBadgeSettingColor = EBadgeSettingColor;
  public maskPattern = DECIMAL_NUMBER;
  ngOnInit(): void {}
}
