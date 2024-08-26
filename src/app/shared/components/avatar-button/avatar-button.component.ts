import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import { trudiUserId } from '@services/constants';
import { User } from '@shared/types/user.interface';

@Component({
  selector: 'avatar-button',
  template: `
    <div
      class="avatar-button cursor-pointer d-flex justify-content-center align-items-center"
      (click)="toggle()"
      [class.selected]="selected"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.min-width.px]="size"
      [style.min-height.px]="size">
      <ng-container *rxIf="!shouldShowTrudiAvatar; else trudiAvatar">
        <ng-container *rxIf="isValidAvatar; else noAvatar">
          <ng-container
            *rxLet="avatar; let _avatar; strategy: 'low'; patchZone: false">
            <img
              [src]="_avatar"
              loading="lazy"
              alt="avatar"
              referrerpolicy="no-referrer" />
            <ng-container *rxIf="selected">
              <div class="overlayer-background"></div>
              <img
                class="overlayer"
                src="/assets/icon/check_mark.svg"
                referrerpolicy="no-referrer" />
            </ng-container>
          </ng-container>
        </ng-container>
      </ng-container>
      <ng-template #noAvatar>
        {{
          { firstName: user.firstName, lastName: user.lastName }
            | formatFullname
        }}
      </ng-template>
      <ng-template #trudiAvatar>
        <img
          src="/assets/icon/trudi_avt.svg"
          alt="trudi_avt"
          referrerpolicy="no-referrer" />
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .avatar-button {
        border-color: transparent;
        transition: 0.3s;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border-width: 0;
        border-style: solid;
        transform: translateY(0);
        position: relative;
        background-color: var(--brand-500);
        color: var(--white);
        font-size: 8px;
        img {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
        }
        .overlayer {
          width: 65%;
          height: 65%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          &-background {
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            position: absolute;
          }
        }
        &:hover {
          border-color: var(--brand-500);
          transform: scale(1.2);
        }
        &.selected {
          opacity: 0.7;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarButtonComponent implements OnChanges {
  @Input() avatar: string;
  @Input() selected = false;
  @Input() size = 32;
  @Input() agencyId?: string;
  @Input() user: User;
  @Output() selectedChange = new EventEmitter<boolean>();

  public isValidAvatar: boolean;
  public shouldShowTrudiAvatar: boolean;
  private _trudiUserId = trudiUserId;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    this.onAvatarChanges(
      changes['avatar']?.previousValue,
      changes['avatar']?.currentValue
    );
    this.onAgencyIdChanges(
      changes['agencyId']?.previousValue,
      changes['agencyId']?.currentValue
    );
  }

  toggle() {
    this.selectedChange.emit(this.selected);
  }

  private onAvatarChanges(previousValue: string, currentValue: string) {
    if (currentValue !== previousValue) {
      const newValue = Boolean(
        currentValue && !currentValue?.includes('google_avatar')
      );
      if (this.isValidAvatar !== newValue) {
        this.isValidAvatar = newValue;
      }
    }
  }

  private onAgencyIdChanges(previousValue: string, currentValue: string) {
    if (currentValue !== previousValue) {
      const newValue = currentValue === this._trudiUserId;
      if (this.shouldShowTrudiAvatar !== newValue) {
        this.shouldShowTrudiAvatar = newValue;
      }
    }
  }
}
