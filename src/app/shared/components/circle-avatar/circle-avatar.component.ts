import { Component, Input, OnInit } from '@angular/core';
import { trudiUserId } from '@services/constants';
import { EUserPropertyType } from '@shared/enum/user.enum';

@Component({
  selector: 'app-circle-avatar',
  templateUrl: './circle-avatar.component.html',
  styleUrls: ['./circle-avatar.component.scss']
})
export class CircleAvatarComponent implements OnInit {
  @Input() firstName: string;
  @Input() lastName: string;
  @Input() userType: EUserPropertyType | string;
  @Input() userId: string;
  @Input() avatar?: string;
  @Input() size: number;
  @Input() isValid: boolean = true;
  @Input() e2ePrefix: string;
  @Input() isDraft: boolean = false;

  trudiUserId = trudiUserId;
  public userPropertyType = EUserPropertyType;
  public firstLetterFirstName: string = '';
  public firstLetterLastName: string = '';
  public sizeOfTextAva: number = 0;
  constructor() {}

  ngOnInit(): void {
    this.sizeOfTextAva = this.size * 0.5;
  }

  get checkAvatar() {
    return this.avatar && !this.avatar.includes('google_avatar');
  }
}
