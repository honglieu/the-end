import { EBehaviorScroll, EScrollBlock } from '../enums/scroll.enum';

export const scrollSelectedIntoView = (position?: EScrollBlock) => {
  const dropdown = document.querySelector('.custom-dropdown-scroll-to-view');
  if (dropdown) {
    const selectedOption = dropdown.querySelector('.ng-option-marked');
    if (dropdown && selectedOption) {
      selectedOption.scrollIntoView({
        behavior: EBehaviorScroll.AUTO,
        block: position || EScrollBlock.START
      });
    }
  } else {
    const selectedOption =
      document.querySelector('.ng-option-marked') ||
      document.querySelector('.ng-selected');
    if (selectedOption) {
      selectedOption.scrollIntoView({
        behavior: EBehaviorScroll.AUTO,
        block: position || EScrollBlock.START
      });
    }
  }
};
