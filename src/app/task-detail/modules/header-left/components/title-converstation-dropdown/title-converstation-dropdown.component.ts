import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'title-converstation-dropdown',
  templateUrl: './title-converstation-dropdown.component.html',
  styleUrls: ['./title-converstation-dropdown.component.scss']
})
export class TitleConverstationDropdownComponent implements OnInit {
  @Input() taskService: TaskService;
  @Output() openModalEvent = new EventEmitter<void>();
  constructor() {}
  ngOnInit(): void {}

  handleOpenModalPeople() {
    this.openModalEvent.emit();
  }
}
