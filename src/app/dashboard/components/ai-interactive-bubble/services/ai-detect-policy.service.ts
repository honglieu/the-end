import { ChatGptService } from '@services/chatGpt.service';
import { Injectable, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Editor } from 'tinymce';
import {
  BehaviorSubject,
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap
} from 'rxjs';
import Mark from 'mark.js';
import { IPolicyDetail } from '@/app/dashboard/modules/agency-settings/utils/enum';
import {
  removeContentIgnore,
  removeTagSpace
} from '@/app/dashboard/components/ai-interactive-bubble/utils/ai-interactive-helper';

@Injectable()
export class AIDetectPolicyService implements OnDestroy {
  private editorInstance: Editor;
  private editorControl: FormControl;
  private previousText: string = '';
  private isPolicyBeingHighlighted: boolean = false;
  public readonly POLICY_HIGHLIGHT_CLASSNAME = 'policy-highlight';
  public readonly AI_TEXT_CLASSNAME: string = 'ai-generated';
  private timeOut2: NodeJS.Timeout = null;
  private timeOut3: NodeJS.Timeout = null;
  private aiGeneratedText: string[] = [];

  private policyPanelData = new BehaviorSubject<IPolicyDetail>(null);
  private isMsgContentChanging = new BehaviorSubject<boolean>(false);
  private originalText = new BehaviorSubject<string>('');
  private isDetectingPolicies = new BehaviorSubject<boolean>(false);
  private detectedPolicies = new BehaviorSubject([]);
  private msgToCheck = new Subject<string>();

  public policyPanelData$ = this.policyPanelData.asObservable();
  public isMsgContentChanging$ = this.isMsgContentChanging.asObservable();
  public originalText$ = this.originalText.asObservable();
  public isDetectingPolicies$ = this.isDetectingPolicies.asObservable();
  public detectedPolicies$ = this.detectedPolicies.asObservable();
  public msgToCheck$ = this.msgToCheck.asObservable();

  private unsubscribe = new Subject<void>();

  constructor() {}

  ngOnDestroy(): void {
    clearTimeout(this.timeOut2);
    clearTimeout(this.timeOut3);
    this.previousText = '';
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  public disconnect() {
    this.unsubscribe.next();
    this.aiGeneratedText = [];
    this.previousText = '';

    this.policyPanelData.next(null);
    this.isMsgContentChanging.next(false);
    this.originalText.next('');
    this.isDetectingPolicies.next(false);
    this.detectedPolicies.next([]);
    this.msgToCheck.next('');

    clearTimeout(this.timeOut2);
    clearTimeout(this.timeOut3);
  }

  public addAIGeneratedText(value: string) {
    this.aiGeneratedText = this.aiGeneratedText.concat(
      this.splitIntoSentences(value.replace(/\s+/g, ' '))
    );
  }

  public setPolicyPanelData(data: IPolicyDetail) {
    this.policyPanelData.next(data);
  }

  private setMsgContentChange(value: boolean) {
    this.isMsgContentChanging.next(value);
  }

  public setPreviousText(value: string) {
    this.previousText = this.getContextText(value);
  }

  public setOriginalText(value: string) {
    this.originalText.next(value);
  }

  public detectPoliciesFromMsg(policies): void {
    const result = policies?.map((item) => ({
      newPolicyDetected: item?.new_policy_detected,
      policyType: item?.policy_type,
      reusableSentenceToBeStored: item?.reusable_sentence_to_be_stored,
      policyTitle: item?.policy_title,
      threeApplicableQuestions: item?.three_applicable_questions
    }));
    this.detectedPolicies.next(result);
    this.isDetectingPolicies.next(false);
  }

  public setEditorInstance(editor, control) {
    this.editorInstance = editor;
    this.editorControl = control;

    if (!editor) return;

    this.editorInstance.on('remove', () => {
      this.disconnect();
    });
    this.editorInstance.on('SetContent', () => {
      if (this.isPolicyBeingHighlighted) {
        clearTimeout(this.timeOut3);
        this.timeOut3 = setTimeout(() => {
          this.scrollToSpecificElement(`.${this.POLICY_HIGHLIGHT_CLASSNAME}`);
        }, 0);
      }
    });
    this.editorControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        debounceTime(300),
        takeUntil(this.unsubscribe)
      )
      .subscribe((value) => {
        this.checkMsgForPolicies();
      });
    this.subscribeToOriginalText();
  }

  private subscribeToOriginalText() {
    this.originalText$.pipe(takeUntil(this.unsubscribe)).subscribe((res) => {
      this.isPolicyBeingHighlighted = !!res;
      this.removeHighlight();
      if (res) {
        this.highlightText(res);
      }
    });
  }

  public triggerDetectPolicies() {
    if (this.isMsgContentChanging.value) {
      clearTimeout(this.timeOut2);
      this.timeOut2 = setTimeout(() => {
        this.checkPolicies();
      }, 0);
    }
  }

  private removeHighlight() {
    const elements = this.editorInstance.dom?.select('span.policy-highlight');
    if (elements) {
      elements.forEach((ele) => {
        const textNode = this.editorInstance.dom.doc?.createTextNode(
          ele.innerText
        );
        this.editorInstance.dom?.replace(textNode, ele);
      });
    }
  }

  private highlightText(value: string) {
    const content = this.editorInstance.getContent();
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;

    const regExp = new RegExp(
      value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gmi'
    );
    const instance = new Mark(tempElement);
    instance.markRegExp(regExp, {
      element: 'span',
      className: this.POLICY_HIGHLIGHT_CLASSNAME,
      acrossElements: true
    });
    this.editorInstance.setContent(tempElement.innerHTML);
  }

  private scrollToSpecificElement(tag: string) {
    if (this.editorInstance) {
      const element = this.editorInstance.dom.select(tag)[0];
      const sendMsgModal = document.getElementById('sendMsgBody');
      const sendBulkMsgModal =
        document.getElementsByClassName('text-attachments')[0];
      if (element) {
        if (sendMsgModal) {
          const targetPosition = element.offsetTop;
          sendMsgModal.scrollTop = targetPosition;
          return;
        }
        if (sendBulkMsgModal) {
          const targetPosition = element.offsetTop;
          sendBulkMsgModal.scrollTop = targetPosition;
          return;
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  private getInnerText() {
    const content = this.editorInstance.getContent({ format: 'html' });
    return this.getContextText(content);
  }

  private getContextText(content: string) {
    const container = document.createElement('div');
    container.innerHTML = content;
    removeContentIgnore(container);
    const resultingText = container.innerText.trim();
    return resultingText;
  }

  private getHumanText() {
    const content = this.editorInstance.getContent({ format: 'html' });
    const container = document.createElement('div');
    container.innerHTML = content;

    const elementsToExclude = container.getElementsByClassName(
      this.AI_TEXT_CLASSNAME
    );
    Array.from(elementsToExclude).forEach((element) => {
      if (element instanceof HTMLElement) {
        element.innerText = '';
      }
    });
    removeContentIgnore(container);
    const resultingText = container.innerText;
    return resultingText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item);
  }

  private getAIGeneratedText() {
    const content = this.editorInstance.getContent({ format: 'html' });
    const container = document.createElement('div');
    container.innerHTML = content;
    const elements = container.getElementsByClassName(this.AI_TEXT_CLASSNAME);
    let text = '';
    Array.from(elements).forEach((element) => {
      if (element instanceof HTMLElement) {
        text += element.innerText + ' ';
      }
    });
    return text;
  }

  private splitIntoSentences(text: string) {
    const sentenceRegex = /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s/;
    const sentences = text
      .split(sentenceRegex)
      .map((item) => item.trim())
      .filter((item) => item);
    return sentences;
  }

  private checkMsgForPolicies() {
    const previousTextOrigin = removeTagSpace(this.previousText);
    const innerText = removeTagSpace(this.getInnerText());
    if (
      !ChatGptService.enableSuggestReplySetting.value ||
      previousTextOrigin === innerText
    )
      return;
    if (!this.isMsgContentChanging.value) {
      this.setMsgContentChange(true);
    }
    clearTimeout(this.timeOut2);
    this.timeOut2 = setTimeout(() => {
      this.checkPolicies();
    }, 5000);
  }

  private checkPolicies() {
    const humanText = this.getHumanText();
    const aiSentences = this.splitIntoSentences(this.getAIGeneratedText());
    const aiModifiedSentences = aiSentences.filter(
      (item) => !this.aiGeneratedText.includes(item)
    );
    let modifiedText = '';
    aiSentences.forEach((item) => {
      if (this.aiGeneratedText.includes(item)) {
        modifiedText += `<ai>${item}</ai>`;
      }
    });
    aiModifiedSentences.forEach((item) => {
      modifiedText += `<human>${item}</human>`;
    });
    humanText.forEach((item) => {
      modifiedText += `<human>${item}</human>`;
    });
    this.setMsgContentChange(false);
    this.previousText = this.getInnerText();
    if (modifiedText) this.isDetectingPolicies.next(true);
    this.detectedPolicies.next([]);
    this.msgToCheck.next(modifiedText);
  }
}
