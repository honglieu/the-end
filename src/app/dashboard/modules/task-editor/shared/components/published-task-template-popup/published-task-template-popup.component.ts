import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AgencyService } from '@/app/dashboard/services/agency.service';
import { takeUntil, Subject } from 'rxjs';
import { ITaskTemplateItem } from '@shared/types/task.interface';

@Component({
  selector: 'published-task-template-popup',
  templateUrl: './published-task-template-popup.component.html',
  styleUrls: ['./published-task-template-popup.component.scss']
})
export class PublishedTaskTemplatePopupComponent implements OnInit {
  private unsubscribe = new Subject<void>();
  @Input() visible: boolean = false;
  @Input() title: string = 'Select inbox folder for published task';
  @Input() taskTemplates = [];
  public isDisabled: boolean = false;
  public dataItems: IDataItem[] = [];
  public topicLists: ITaskTemplateItem[] = [];

  @Output() onConfirm: EventEmitter<any> = new EventEmitter();
  @Output() onClose: EventEmitter<void> = new EventEmitter();

  constructor(private agencyService: AgencyService) {}

  ngOnInit(): void {
    this.agencyService.listTask$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((res) => {
        if (res) {
          this.topicLists = res.PUBLISHED;
        }
      });
  }

  ngAfterViewInit() {
    const modalElement = document.querySelector('.published-task');
    if (modalElement) {
      const modalHeight = modalElement.clientHeight;

      if (modalHeight > 640) {
        modalElement.classList.add('published-task-form');
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskTemplates']) {
      this.dataItems = this.taskTemplates.map((taskTemplate) => {
        return {
          id: taskTemplate.id,
          name: taskTemplate.name,
          topicId: new FormControl(taskTemplate.topic?.id || null, [
            Validators.required
          ]),
          isAIDynamicParamValid:
            taskTemplate.template.isAIDynamicParamValid ?? true
        };
      });
    }
  }

  handleOk() {
    this.isDisabled = true;
    this.dataItems.forEach((item) => {
      item.topicId.markAsTouched();
    });
    const isInvalidValue = this.dataItems.some((item) => item.topicId.invalid);
    if (isInvalidValue) {
      this.isDisabled = false;
      return;
    }
    this.onConfirm.emit(
      this.dataItems.map((item) => {
        return {
          id: item.id,
          topicId: item.topicId.value,
          isAIDynamicParamValid: item.isAIDynamicParamValid
        };
      })
    );
  }

  handleCancel() {
    this.onClose.emit();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}

interface IDataItem {
  id: string;
  name: string;
  topicId: FormControl;
  isAIDynamicParamValid?: boolean;
}
