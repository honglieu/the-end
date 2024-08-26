import type { OnDestroy } from '@angular/core';
import { Component } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import {
  BrowserAnimationsModule,
  NoopAnimationsModule
} from '@angular/platform-browser/animations';
import { moduleMetadata } from '@storybook/angular';
import type { Meta, Story } from '@storybook/angular/types-6-0';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { TrudiButtonComponent } from 'src/app/trudi-ui/views/trudi-button/trudi-button.component';
import { TrudiDrawerComponent } from 'src/app/trudi-ui/views/trudi-drawer/trudi-drawer.component';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';

@Component({
  selector: 'trudi-drawer-skeleton',
  template: `
    <div *ngIf="isLoading" class="trudi-drawer-skeleton">
      <div class="trudi-drawer-skeleton-content">
        <div class="skeleton-content-header">
          <nz-skeleton
            [nzActive]="true"
            [nzParagraph]="{ rows: 0 }"></nz-skeleton>
        </div>

        <div class="skeleton-content-body-row1">
          <div class="item">
            <nz-skeleton
              style="width: 60px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
          <div class="item">
            <nz-skeleton
              style="width: 60px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
        </div>

        <div class="skeleton-content-body-row2">
          <div class="item">
            <nz-skeleton
              style="width: 210px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
          <div class="item">
            <nz-skeleton
              style="width: 210px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
        </div>

        <div class="skeleton-content-body-row3">
          <div class="item">
            <nz-skeleton
              style="width: 60px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
        </div>

        <div class="skeleton-content-body-row4">
          <div class="item">
            <nz-skeleton
              style="width: 410px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
        </div>

        <div class="skeleton-content-body-row5">
          <div class="item">
            <nz-skeleton
              style="width: 60px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
          <div class="item d-flex">
            <nz-skeleton
              style="width: 30px"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
            <nz-skeleton
              style="width: 60px; margin-left: 10px;"
              [nzActive]="true"
              [nzParagraph]="{ rows: 0 }"></nz-skeleton>
          </div>
        </div>

        <div class="skeleton-content-body-row6">
          <div class="item-container">
            <div class="d-flex align-items-center">
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"></nz-skeleton-element>
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"
                style="margin-left: 16px;"></nz-skeleton-element>
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"
                style="margin-left: 16px;"></nz-skeleton-element>
              <span class="vertical-line"></span>
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"
                style="margin-left: 16px;"></nz-skeleton-element>
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"
                style="margin-left: 16px;"></nz-skeleton-element>
              <span class="vertical-line"></span>
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"
                style="margin-left: 16px;"></nz-skeleton-element>
              <span class=""></span>
              <nz-skeleton-element
                nzType="avatar"
                [nzActive]="true"
                [nzSize]="'small'"
                style="margin-left: 16px;"></nz-skeleton-element>
            </div>
            <div class="item-container-row">
              <nz-skeleton
                style="width: 360px"
                [nzActive]="true"
                [nzParagraph]="{ rows: 0 }"></nz-skeleton>
            </div>
            <div class="mt-8">
              <nz-skeleton
                style="width: 400px"
                [nzActive]="true"
                [nzParagraph]="{ rows: 0 }"></nz-skeleton>
            </div>
            <div class="mt-8">
              <nz-skeleton
                style="width: 440px"
                [nzActive]="true"
                [nzParagraph]="{ rows: 0 }"></nz-skeleton>
            </div>
            <div class="mt-8">
              <nz-skeleton
                style="width: 480px"
                [nzActive]="true"
                [nzParagraph]="{ rows: 0 }"></nz-skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .trudi-drawer-skeleton {
        height: 100%;
        display: flex;
        flex-direction: column;

        ::ng-deep nz-skeleton {
          .ant-skeleton-content {
            .ant-skeleton-title {
              margin: 0;
            }
            .ant-skeleton-paragraph {
              margin: 0;
            }
          }
        }

        ::ng-deep nz-skeleton-element {
          .ant-skeleton-avatar-sm {
            width: 16px;
            height: 16px;
          }
        }

        .trudi-drawer-skeleton-content {
          flex: 1;
          padding: 20px 24px;
          display: flex;
          flex-direction: column;

          .skeleton-content-header {
            width: 50%;
            margin-bottom: 50px;
          }

          .skeleton-content-body-row1,
          .skeleton-content-body-row2,
          .skeleton-content-body-row3,
          .skeleton-content-body-row4,
          .skeleton-content-body-row5,
          .skeleton-content-body-row6 {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            column-gap: 24px;

            div.item {
              flex: 1;
            }
          }

          .skeleton-content-body-row2,
          .skeleton-content-body-row4 {
            margin-top: 12px;
            div.item {
              padding: 14px 12px;
              background-color: #f2f5f7;
              border-radius: 8px;
            }
          }

          .skeleton-content-body-row3,
          .skeleton-content-body-row5 {
            margin-top: 24px;
          }

          .skeleton-content-body-row5 {
            div.item {
              flex: unset;
            }
          }

          .skeleton-content-body-row6 {
            flex: 1;
            margin-top: 12px;
            column-gap: unset;

            div.item-container {
              width: 100%;
              height: 100%;
              padding: 12px 16px;
              border-radius: 8px;
              background-color: #f2f5f7;

              .item-container-row {
                margin-top: 20px;
              }

              .vertical-line {
                width: 1px;
                height: 16px;
                margin-left: 16px;
                margin-bottom: 4px;
                background-color: #e3e5e7;
              }
            }
          }
        }

        .trudi-drawer-skeleton-footer {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          .trudi-drawer-footer-left {
            display: flex;
            align-items: center;
            column-gap: 16px;
          }
          .trudi-drawer-footer-right {
            display: flex;
            align-items: center;
            column-gap: 16px;
          }
        }
      }
    `
  ]
})
class TrudiDrawerSkeletonComponent implements OnDestroy {
  public isLoading = true;
  public timeOutId;
  constructor() {
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }
  ngOnDestroy(): void {
    clearTimeout(this.timeOutId);
  }
}

export default {
  title: 'trudi-ui/Drawer',
  component: TrudiDrawerComponent,
  argTypes: {
    visible: {
      name: 'visible',
      type: 'boolean'
    },
    onOk: {
      action: 'onOk'
    },
    onCancel: {
      action: 'onCancel'
    }
  },
  decorators: [
    moduleMetadata({
      imports: [
        HttpClientModule,
        BrowserAnimationsModule,
        NoopAnimationsModule,
        NzDrawerModule,
        NzSkeletonModule
      ],
      providers: [NzDrawerService],
      declarations: [
        TrudiDrawerComponent,
        TrudiButtonComponent,
        TrudiDrawerSkeletonComponent
      ]
    })
  ]
} as Meta;

const Template: Story<TrudiDrawerComponent> = (args: TrudiDrawerComponent) => ({
  template: `
    <div>
      <button variant="outlined" size="medium" trudi-btn (click)="visible = !visible">Normal</button> 
    </div>

    <trudi-drawer 
      [(visible)]="visible" 
      [enableOkBtn]="enableOkBtn"
      [enableBackBtn]="enableBackBtn"
      [enableDeleteBtn]="enableDeleteBtn"
      [okText]="okText"
      [headerTpl]="'Header'"
      (onCancel)="visible = false"
      (onOk)="onOk()"
    >
      <ng-container *ngIf="visible"><trudi-drawer-skeleton></trudi-drawer-skeleton></ng-container>
    </trudi-drawer>
  `,
  component: TrudiDrawerComponent,
  props: args
});

export const normal = Template.bind({});
normal.args = {
  visible: false,
  enableBackBtn: true,
  enableOkBtn: true,
  enableDeleteBtn: false,
  okText: 'Confirm'
};

const TemplateCustom: Story<TrudiDrawerComponent> = (
  args: TrudiDrawerComponent
) => ({
  template: `
    <div>
      <button variant="outlined" size="medium" trudi-btn (click)="visible = !visible">Custom modal</button> 
    </div>

    <trudi-drawer 
    [(visible)]="visible" 
    [enableBackBtn]="enableBackBtn"
    [enableDeleteBtn]="enableDeleteBtn"
    [okText]="Save"
    (onCancel)="visible = false"
    (onOk)="visible = false"
    [footerTpl]="footerTpl"
    [headerTpl]="headerTpl"
    >
      <ng-container *ngIf="visible"><trudi-drawer-skeleton></trudi-drawer-skeleton></ng-container>
    </trudi-drawer>
    <ng-template #footerTpl> Footer custom </ng-template>
    <ng-template #headerTpl> Header custom </ng-template>
  `,
  component: TrudiDrawerComponent,
  props: args
});

export const custom = TemplateCustom.bind({});
custom.args = {
  visible: false
};
