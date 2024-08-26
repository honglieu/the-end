import { Component, Input } from '@angular/core';
@Component({
  selector: 'in-task-tag',
  templateUrl: './in-task-tag.component.html',
  styleUrl: './in-task-tag.component.scss'
})
export class InTaskTagComponent {
  @Input() inTask: boolean = false;
}
