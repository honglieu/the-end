import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'trudi-max-character',
  templateUrl: './trudi-max-character.component.html',
  styleUrls: ['./trudi-max-character.component.scss']
})
export class TrudiMaxCharacterComponent implements OnInit {
  @Input() maxCharacter: number = null;
  // If in the mode to show the remainder character (showRemainderCharacterMode is false currentLength/maxvalue):
  //   The ratio of the current length to the maximum length limit.
  // Otherwise, if in the mode to show the remainder character (showRemainderCharacterMode is true maxvalue- currentLength / maxvalue):
  //   The ratio of the remaining part of the maximum length limit to the current length.
  @Input() showRemainderCharacterMode: boolean = true;
  @Input() currentLength: number = null;
  @Input() onlyShowMaxCharacter: boolean = false;
  constructor() {}

  ngOnInit(): void {}
}
