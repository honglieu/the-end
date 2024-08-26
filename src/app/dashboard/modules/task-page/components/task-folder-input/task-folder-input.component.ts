import { IIcon } from '@/app/dashboard/modules/task-page/interfaces/task.interface';
import { TrudiTextFieldComponent } from '@trudi-ui';
import { ETrudiIconType } from '@trudi-ui';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'task-folder-input',
  standalone: false,
  templateUrl: './task-folder-input.component.html',
  styleUrl: './task-folder-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TaskFolderInputComponent),
      multi: true
    }
  ]
})
export class TaskFolderInputComponent
  implements ControlValueAccessor, OnInit, OnDestroy, OnChanges
{
  @ViewChild('folderNameRef') folderNameRef: TrudiTextFieldComponent;
  @Input() disabled: boolean = false;
  @Input() showColorPicker = false;
  @Input() placeholder: string = '';
  @Input() defaultFolderIcon: string;
  @Output() changeSelectedIcon = new EventEmitter<IIcon>();
  @Output() triggerEventBlur = new EventEmitter();
  @Output() triggerDropdown = new EventEmitter();

  private _value: string;
  get value() {
    return this._value;
  }
  set value(val: string) {
    this._value = val;
    this.onChange(this._value);
    this.onTouched();
  }
  onChange: (_: string) => void = () => {};
  onTouched: () => void = () => {};
  registerOnChange(fn): void {
    this.onChange = fn;
  }
  registerOnTouched(fn): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  writeValue(value: string): void {
    this.value = value;
  }

  onFocus() {
    this.folderNameRef.inputElem.nativeElement.focus();
  }

  private destroy$ = new Subject<void>();
  public listIcon: IIcon[] = Object.keys(ETrudiIconType).map((it) => ({
    icon: it,
    src: 'assets/images/folder-images/' + ETrudiIconType[it] + '.png',
    name: ETrudiIconType[it]?.replace(/^trudi-fi-sr-|^trudi-/, '') as string
  }));
  public listSearchIcon: IIcon[] = this.listIcon;
  public selectedIcon: IIcon = this.getDefaultFolderIcon;
  public iconControl = new FormControl(null);

  ngOnInit(): void {
    this.changeSelectedIcon.emit(this.selectedIcon);
    this.iconControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if (!value) {
          this.listSearchIcon = this.listIcon;
        } else {
          this.listSearchIcon = this.listIcon.filter((it) =>
            it?.name?.toLowerCase()?.includes(value.toLowerCase())
          );
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['defaultFolderIcon']?.currentValue) {
      this.selectedIcon = this.listIcon.find(
        (icon) => icon.icon === this.defaultFolderIcon
      );
    }
  }

  public handleBlurFolderName() {
    this.triggerEventBlur.emit();
  }

  public handleFolderDropdown() {
    this.triggerDropdown.emit();
  }

  public onChangeIcon(icon: IIcon) {
    this.selectedIcon = icon;
    this.changeSelectedIcon.emit(icon);
  }

  get getDefaultFolderIcon() {
    return this.listIcon.find((it) => it.icon === 'TrudiFiSrFolder');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
