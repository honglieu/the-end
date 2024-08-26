import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  IHelpDocument,
  IHelpDocumentStep
} from '@/app/dashboard/modules/task-editor/interfaces/help-document.interface';
import { EHelpDocumentTitle } from '@/app/dashboard/modules/task-editor/enums/help-document.enum';
import { DomSanitizer } from '@angular/platform-browser';
import {
  ECalendarEvent,
  EComponentTypes,
  EStepAction
} from '@/app/dashboard/modules/task-editor/enums/task-editor.enums';

@Component({
  selector: 'help-document-popup',
  templateUrl: './help-document-popup.component.html',
  styleUrls: ['./help-document-popup.component.scss']
})
export class HelpDocumentPopupComponent implements OnChanges, AfterViewInit {
  @ViewChild('helpSidebar', { static: true }) helpSidebar!: ElementRef;
  @ViewChild('helpContent', { static: true }) helpContent!: ElementRef;
  @Input() currentHelpDocumentStepType:
    | EStepAction
    | ECalendarEvent
    | EComponentTypes;
  @Input() visible: boolean;
  @Input() helpDocument: IHelpDocument[];
  @Input() helpDocumentTitle: EHelpDocumentTitle;
  @Output() popupClosed = new EventEmitter();
  public currentStep: IHelpDocumentStep;
  public readonly EHelpDocumentTitle = EHelpDocumentTitle;

  constructor(private sanitizer: DomSanitizer, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['helpDocument']?.currentValue) {
      this.currentStep = this.helpDocument[0].steps[0];
      this.sanitizeDescription();
    }
    if (changes['currentHelpDocumentStepType']?.currentValue) {
      const groupWithMatchingStep = this.helpDocument.find((group) =>
        group.steps.some((step) => step.id === this.currentHelpDocumentStepType)
      );

      if (groupWithMatchingStep) {
        this.currentStep = groupWithMatchingStep.steps.find(
          (step) => step.id === this.currentHelpDocumentStepType
        );
      } else {
        this.currentStep = this.helpDocument[0].steps[0];
      }
    }
  }

  ngAfterViewInit(): void {
    this.scrollToCurrentStep();
  }

  scrollToCurrentStep() {
    const helpSidebarElement = this.helpSidebar?.nativeElement;
    if (helpSidebarElement) {
      const currentStepElement = helpSidebarElement.querySelector('.active');
      const groupTitleElement = helpSidebarElement.querySelector(
        '.help__sidebar--title'
      );
      this.renderer.setProperty(
        helpSidebarElement,
        'scrollTop',
        currentStepElement.offsetTop - (groupTitleElement?.clientHeight || 0)
      );
    }
  }

  sanitizeDescription() {
    this.helpDocument = this.helpDocument.map((group) => {
      return {
        ...group,
        steps: group.steps.map((val) => {
          return {
            ...val,
            description: this.sanitizer.bypassSecurityTrustHtml(
              val.description
            ) as string
          };
        })
      };
    });
  }

  selectCurrentStep(step: IHelpDocumentStep) {
    if (step.title === this.currentStep.title) return;
    this.renderer.setProperty(this.helpContent?.nativeElement, 'scrollTop', 0);
    this.currentStep = step;
  }

  handleCancel() {
    this.popupClosed.emit();
  }
}
