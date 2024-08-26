import { PoliciesFormService } from '@/app/dashboard/modules/agency-settings/components/policies/services/policies-form.service';
import { IQuestionPolicy } from '@/app/dashboard/modules/agency-settings/utils/enum';
import { AiPolicyService } from '@/app/dashboard/services/ai-policy.service';
import {
  IAiReply,
  IChatGPTEnquiry
} from '@/app/mailbox-setting/interface/mailbox-setting.interface';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import uuid4 from 'uuid4';

@Component({
  selector: 'question-tag',
  templateUrl: './question-tag.component.html',
  styleUrls: ['./question-tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionTagComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('questionTag') questionTags: QueryList<ElementRef>;
  @ViewChild('wrapper') wrapper: ElementRef;

  @Input() listQuestions: IQuestionPolicy[] = [];
  @Input() isShowAddButton: boolean = false;
  @Input() isClosable: boolean = false;
  @Input() isShowMore: boolean = false;
  @Input() isShowHiddenQuestions: boolean = false;
  @Input() isShowError: boolean = false;
  @Input() canSearching: boolean = false;
  @Output() onClose: EventEmitter<IChatGPTEnquiry[]> = new EventEmitter();
  @Output() onEditQuestion: EventEmitter<any> = new EventEmitter();
  @Output() onAddQuestion: EventEmitter<IChatGPTEnquiry[]> = new EventEmitter();
  @Input() isCurrentQuestion: boolean = false;
  @Input() widthReplyQuestions: number = 0;

  private unsubscribe = new Subject<void>();

  public currentListQuestions: IQuestionPolicy[] | IAiReply[] = [];
  public isAddQuestion: boolean = false;
  public searchValue: string = '';
  public countHiddenQuestions: string;
  public isArchivedMailbox: boolean = false;
  public hiddenTagsCount: number = 0;
  public lastVisibleTagIndex: number = 0;
  public maxWidthLastIndex: string = 'unset';
  public isEditQuestion: boolean = false;
  public listSimilarQuestion: IQuestionPolicy[] = [];
  public currentItemEditQuestion: IQuestionPolicy;

  get questionForm() {
    return this.policiesFormService?.questionForm;
  }

  get question() {
    return this.questionForm.get('question');
  }

  get editQuestion() {
    return this.questionForm.get('editQuestion');
  }

  constructor(
    private policiesFormService: PoliciesFormService,
    private elementRef: ElementRef,
    private aiPolicyService: AiPolicyService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.policiesFormService.buildQuestionForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { listQuestions } = changes || {};
    if (listQuestions?.currentValue) {
      this.currentListQuestions = this.listQuestions;
      this.listSimilarQuestion = this.getSimilarQuestion(
        listQuestions?.currentValue
      );
      setTimeout(() => this.getVisibleQuestionTags());
    }
  }

  ngOnInit(): void {
    this.aiPolicyService.aiReplyPolicySearchValue$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((searchValue) => {
        this.searchValue = searchValue?.trim();
      });

    this.question.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        this.question.setValidators(
          this.policiesFormService.validateDuplicateQuestion(
            this.currentListQuestions
          )
        );
      });
    this.editQuestion.valueChanges
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        this.editQuestion.setValidators(
          this.policiesFormService.validateDuplicateQuestion(
            this.currentListQuestions,
            this.currentItemEditQuestion
          )
        );
      });
  }

  ngAfterViewInit() {
    this.getVisibleQuestionTags();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.getVisibleQuestionTags();
  }

  handleEnterQuestion(itemEdit) {
    this.currentListQuestions = this.currentListQuestions?.map((item) => {
      return {
        ...item,
        editQuestions: item.id === itemEdit.id
      };
    });
    this.editQuestion.setValue(itemEdit.question);
  }

  getSimilarQuestion(listQuestions) {
    return listQuestions
      ?.filter((i) => i?.similarPolicies?.length && i?.isInvalidSimilarPolicies)
      ?.map((item) => {
        return {
          ...item,
          messageInvalid: `Similar question “${
            item.question
          }” appears in policy <strong>${item.similarPolicies
            ?.map((i) => i.name)
            ?.join(', ')}</strong>`
        };
      });
  }

  getVisibleQuestionTags() {
    const wrapperElement =
      this.elementRef?.nativeElement?.querySelector('.wrapper');
    const tagElements = [...wrapperElement?.querySelectorAll('.question-tag')];
    const maxRowVisible = 2;
    const gap = 4;
    let currentRowWidth = 0;
    let currentRow = 1;
    let lastVisibleTagIndex = -1;
    let maxWidthLastIndex = 0;

    tagElements.length > 2 &&
      tagElements.some((tagElement: HTMLElement, index: number) => {
        const tagWidth = tagElement?.offsetWidth + (index ? gap : 0);
        currentRowWidth += tagWidth;
        if (currentRowWidth > wrapperElement.offsetWidth) {
          currentRow++;
          if (currentRow > maxRowVisible) {
            lastVisibleTagIndex = index === 1 ? index : index - 1;
            index !== 1 && (currentRowWidth -= tagWidth);
            return true;
          }
          currentRowWidth = index ? tagWidth - gap : 0;
        }
        if (
          currentRowWidth === wrapperElement.offsetWidth &&
          currentRow === maxRowVisible
        ) {
          lastVisibleTagIndex = index;
          return true;
        }
        return false;
      });

    if (lastVisibleTagIndex > -1) {
      const lastIndexMinWidth = 100;
      const lastIndexWidth = tagElements[lastVisibleTagIndex].offsetWidth;
      const isShorterThanMinWidth =
        lastIndexWidth < lastIndexMinWidth &&
        wrapperElement.offsetWidth - currentRowWidth < lastIndexMinWidth &&
        lastVisibleTagIndex > 1;

      isShorterThanMinWidth && lastVisibleTagIndex--;

      maxWidthLastIndex =
        tagElements[lastVisibleTagIndex].offsetWidth +
        (wrapperElement.offsetWidth - currentRowWidth) +
        (isShorterThanMinWidth ? lastIndexWidth : -5);

      this.hiddenTagsCount =
        this.listQuestions?.length - lastVisibleTagIndex - 1;
    } else {
      this.hiddenTagsCount = 0;
    }

    this.maxWidthLastIndex =
      maxWidthLastIndex > 0 && maxWidthLastIndex < wrapperElement.offsetWidth
        ? maxWidthLastIndex + 'px'
        : this.widthReplyQuestions > 0
        ? this.widthReplyQuestions + 'px'
        : 'auto';

    this.lastVisibleTagIndex = lastVisibleTagIndex;

    this.ngZone.run(() => {
      this.cdr.markForCheck();
    });
  }

  onCloseTag(event, itemRemove) {
    if (!event) return;
    event.stopPropagation();
    this.currentListQuestions = this.currentListQuestions.filter(
      (item) => item.id !== itemRemove.id
    );
    this.onClose.emit(this.currentListQuestions);
  }

  handleAddQuestion(event) {
    this.question.setValue('');
    if (!event || this.isArchivedMailbox) return;
    event.stopPropagation();
    this.isAddQuestion = true;
    this.isShowAddButton = false;
  }

  onEnterAddQuestion(event) {
    if (event.key === 'Enter') {
      this.onBlur(event);
    }
  }

  onBlur(event) {
    if (!event || this.question.invalid) return;
    if (!this.question.value.trim()) {
      this.isAddQuestion = false;
      this.isShowAddButton = true;
      return;
    }
    this.currentListQuestions = [
      ...this.currentListQuestions,
      {
        id: uuid4(),
        isAddNewQuestion: true,
        question: this.question.value
      }
    ];
    this.question.setValue(this.question.value);
    this.question.setValidators(
      this.policiesFormService.validateDuplicateQuestion(
        this.currentListQuestions
      )
    );
    this.onAddQuestion.emit(this.currentListQuestions);
    this.isAddQuestion = false;
    this.isShowAddButton = true;
  }

  handleEditQuestion(event, item) {
    if (this.editQuestion.invalid) return;

    this.currentItemEditQuestion = item;
    const questionsEdited = this.currentListQuestions.map((i) => {
      return {
        ...i,
        editQuestions: i.id === item.id
      };
    });
    this.currentListQuestions = questionsEdited;
    this.editQuestion.setValue(item.question);
  }

  onBlurEditQuestion(event, item) {
    if (this.editQuestion.invalid) return;

    this.currentListQuestions = this.currentListQuestions?.map((i) => {
      return {
        ...i,
        question: item.id === i.id ? this.editQuestion.value : i.question,
        editQuestions: false,
        questionEdited: item.id === i.id,
        isInvalidSimilarPolicies:
          item.id === i.id
            ? (i.similarPolicies ? i.similarPolicies[0].question : '')
                .toLowerCase()
                .trim() === this.editQuestion.value.toLowerCase().trim()
            : i.isInvalidSimilarPolicies
      };
    });
    this.listSimilarQuestion = this.getSimilarQuestion(
      this.currentListQuestions
    );
    this.question.setValidators(
      this.policiesFormService.validateDuplicateQuestion(
        this.currentListQuestions,
        this.currentItemEditQuestion
      )
    );

    const isInvalid = this.listSimilarQuestion.some(
      (i) => i?.isInvalidSimilarPolicies
    );
    if (!isInvalid) {
      this.question.clearValidators();
      this.question.updateValueAndValidity();
    }
    this.onEditQuestion.emit(this.currentListQuestions);
  }

  cancelEditTitle() {
    this.isEditQuestion = false;
  }
}
