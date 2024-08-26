import { CommonModule, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CustomPipesModule } from '@/app/shared/pipes/customPipes.module';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'reply-file',
  standalone: true,
  imports: [CommonModule, NgIf, CustomPipesModule, NzToolTipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reply-file.component.html',
  styleUrl: './reply-file.component.scss'
})
export class ReplyFileComponent {
  @Input() classes: { [key: string]: boolean } = {};
  @Input() file = null;
}
