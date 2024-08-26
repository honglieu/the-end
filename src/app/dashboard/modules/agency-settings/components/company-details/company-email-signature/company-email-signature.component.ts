import { PermissionService } from './../../../../../../services/permission.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CompanyEmailSignatureService } from '@services/company-email-signature.service';
import { AgencyService as AgencyDashboardService } from '@/app/dashboard/services/agency.service';
import { LoadingService } from '@services/loading.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from '@services/user.service';
import { UserService as UserDashboardService } from '@/app/dashboard/services/user.service';
import { CurrentUser } from '@shared/types/user.interface';
import { MailboxSettingService } from '@/app/mailbox-setting/services/mailbox-setting.service';
import { IMailboxSetting } from '@/app/mailbox-setting/interface/mailbox-setting.interface';
@Component({
  selector: 'company-email-signature',
  templateUrl: './company-email-signature.component.html',
  styleUrls: ['./company-email-signature.component.scss']
})
export class CompanyEmailSignatureComponent implements OnInit, OnDestroy {
  private unsubscribe = new Subject<void>();
  currentMailboxSetting: IMailboxSetting;
  agencyId = '';
  valueInput: string = '';
  err: boolean = false;
  activeTab1: boolean = true;
  activeTab2: boolean = false;
  default: boolean = true;
  highlighted: boolean = false;
  showTextarea: boolean = false;
  isButtonsVisible: boolean = false;
  showBtnControl: boolean = false;
  activeTab: boolean = true;
  showDesign: boolean = true;
  currentSignature: string = '';
  readOnly = false;
  emailSignatureDefault = '';
  public currentUser: CurrentUser;
  public editorConfig = {
    selector: 'textarea',
    base_url: '/tinymce',
    suffix: '.min',
    content_css: '/assets/css/editor-signature.css',
    toolbar_sticky: true,
    menubar: false,
    statusbar: false,
    toolbar: false,
    plugins: 'lists autoresize',
    object_resizing: false,
    paste_data_images: false,
    drag_image_upload: false,
    notifications: false,
    autoresize_overflow_padding: 0,
    autoresize_bottom_margin: 15,
    min_height: 170,
    placeholder: 'Copy and paste your email signature here...',
    paste_remove_styles_if_webkit: false,
    visualblocks_default_state: false,
    end_container_on_empty_block: false,
    visual: false,
    setup: function (editor) {
      editor.on('keydown', function (e) {
        // Check if the key pressed is backspace or del
        if (e.keyCode === 8 || e.keyCode === 46) {
          throw '';
        }
      });
    }
  };

  constructor(
    private emailSignatureService: CompanyEmailSignatureService,
    private readonly agencyDashboardService: AgencyDashboardService,
    public loadingService: LoadingService,
    public toastService: ToastrService,
    public userDashboardService: UserDashboardService,
    public userService: UserService,
    private permissionService: PermissionService,
    private mailboxSettingService: MailboxSettingService
  ) {}

  ngOnInit(): void {
    this.getCompanyEmailSignature();
    this.mailboxSettingService.mailboxSetting$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((mailboxSetting) => {
        this.currentMailboxSetting = mailboxSetting;
      });
  }

  clickOutSide() {
    this.valueInput = this.currentSignature;
    this.err = false;
    this.selectedTabSignature(true, false);
    this.hide();
  }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getCompanyEmailSignature() {
    this.valueInput = this.emailSignatureDefault;
    this.emailSignatureService.getEmailSignature().subscribe((data) => {
      if (data) {
        this.valueInput = data;
        this.currentSignature = this.valueInput;
        this.readOnly = !this.permissionService.hasFunction(
          'COMPANY_DETAIL.EMAIL_SIGNATURE.EDIT'
        );
      }
    });
  }

  saveCompanyEmailSignature(body: { content: string }) {
    this.emailSignatureService.createEmailSignature(body).subscribe({
      next: () => {
        this.toastService.success('Email signature saved');
        this.currentSignature = this.valueInput;
        this.emailSignatureService.signatureContent.next(this.currentSignature);
        this.selectedTabSignature(true, false);
        this.err = false;
        this.hide();
        this.mailboxSettingService.setMailboxSetting({
          ...this.currentMailboxSetting,
          agencyContent: body?.content?.trim()
        });
      },
      error: (error) => {
        this.toastService.error(error?.error?.message);
        this.settingSignature(true, true, true);
      }
    });
  }

  onBoxClick() {
    if (this.readOnly) {
      if (this.activeTab1) {
        this.selectedTabSignature(true, false);
        this.settingSignature(false, false, false);
      } else {
        this.selectedTabSignature(false, true);
        this.showTextarea = true;
      }
      return;
    }
    this.highlighted = true;
    this.isButtonsVisible = true;
    this.showTextarea = true;
  }
  onCancel(event) {
    event.preventDefault();
    event.stopPropagation();
    this.valueInput = this.currentSignature;
    this.settingSignature(false);
    this.selectedTabSignature(true, false);
    this.hide();
  }

  onSave(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.valueInput === '') {
      this.settingSignature(true, true, true);
      return;
    }
    this.saveCompanyEmailSignature({
      content: this.valueInput?.trim()
    });
  }

  getHeight() {
    const lineHeight = 20;
    const minHeight = 60;
    const maxHeight = 296;
    const textLength = this.valueInput.length;
    const rows = Math.ceil(textLength / 50);
    let height = rows * lineHeight;
    height = height < minHeight ? minHeight : height;
    height = height > maxHeight ? maxHeight : height;
    return height + 'px';
  }

  private selectedTabSignature(activeTab1: boolean, activeTab2: boolean) {
    this.activeTab1 = activeTab1;
    this.activeTab2 = activeTab2;
  }
  private settingSignature(
    err?: boolean,
    showTextarea?: boolean,
    isButtonsVisible?: boolean
  ) {
    this.err = err;
    this.showTextarea = showTextarea;
    this.isButtonsVisible = isButtonsVisible;
  }
  private hide() {
    this.highlighted = false;
    this.isButtonsVisible = false;
    this.showTextarea = false;
  }
}
