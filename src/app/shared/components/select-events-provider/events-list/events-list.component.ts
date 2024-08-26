import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { EventsToggle } from '@/app/profile-setting/integrations/constants/constants';
import { EIntegrationsStatus } from '@/app/profile-setting/utils/integrations.interface';

@Component({
  selector: 'events-list',
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss']
})
export class EventsListComponent implements OnInit {
  @Input() title: string;
  @Input() icon: string;
  @Input() svgClass: string;
  @Input() events: EventsToggle[];
  @Output() itemToggle = new EventEmitter<{}>();
  @Input() status: EIntegrationsStatus;
  public EIntegrationsStatus = EIntegrationsStatus;
  public form: FormGroup;
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = new FormGroup({});
    this.initForm();
    this.valueChange();
  }

  initForm() {
    const eventsObject = this.events.reduce((acc, event) => {
      acc[event.key] = new FormControl(event.isChecked);
      return acc;
    }, {});
    this.form = this.fb.group(eventsObject);
    this.emitFormValue(this.form.value);
  }

  valueChange() {
    this.form.valueChanges.subscribe((data) => {
      if (data) {
        this.emitFormValue(data);
      }
    });
  }

  emitFormValue(data) {
    return this.itemToggle.emit(data);
  }

  itemTrackBy(index: number) {
    return index;
  }
}
