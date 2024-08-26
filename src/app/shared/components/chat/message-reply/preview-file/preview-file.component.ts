import { CommonModule, NgIf } from '@angular/common';
import { FilesService } from '@services/files.service';
import { CustomPipesModule } from '@shared/pipes/customPipes.module';
import { IFile } from '@shared/types/file.interface';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Type,
  ViewChild,
  ViewContainerRef,
  inject
} from '@angular/core';
import {
  ReplyPhotoComponent,
  ReplyFileComponent,
  ReplyVideoComponent
} from '@shared/components/chat/message-reply';

@Component({
  selector: 'preview-file',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    CustomPipesModule,
    ReplyPhotoComponent,
    ReplyVideoComponent,
    ReplyFileComponent
  ],
  template: '<ng-container #dynamicAttachment></ng-container>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewFileComponent implements OnChanges {
  @Input() classes: { [key: string]: boolean } = {};
  @Input() file: IFile = null;
  @ViewChild('dynamicAttachment', {
    read: ViewContainerRef,
    static: true
  })
  private container: ViewContainerRef;
  private fileService = inject(FilesService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file']?.currentValue) {
      this.loadComponent();
    }
  }

  loadComponent() {
    if (!this.file) return;
    const fileType = this.getFileType(this.file);
    let componentFactory = this.getComponentType(fileType);
    this.container.clear();
    if (!componentFactory) return;
    const componentRef = this.container.createComponent(componentFactory);
    componentRef.instance.file = this.file;
    componentRef.instance.classes = this.classes;
  }

  private getComponentType(
    fileType: string
  ): Type<ReplyPhotoComponent | ReplyFileComponent | ReplyVideoComponent> {
    switch (fileType) {
      case 'video':
        return ReplyVideoComponent;
      case 'photo':
        return ReplyPhotoComponent;
      default:
        return ReplyFileComponent;
    }
  }

  getFileType(file: IFile): string {
    const fileTypeDot = this.fileService.getFileTypeDot(file.name);
    return (
      this.fileService.getFileTypeSlash(file.fileType?.name) || fileTypeDot
    );
  }
}
