import { Injectable } from '@angular/core';
import { IMention } from '../utils/comment.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentsEditorService {
  getBasicConfig(customUiSelector: string = '') {
    return {
      selector: 'textarea',
      custom_ui_selector: customUiSelector,
      placeholder: 'Press ‘@’ to mention somebody',
      base_url: '/tinymce',
      suffix: '.min',
      content_css: '/assets/styles/tiny-editor.css',
      toolbar_sticky: true,
      menubar: false,
      statusbar: false,
      toolbar: false,
      plugins: '',
      convert_urls: false,
      inline_boundaries_selector: 'code',
      notifications: false,
      object_resizing: false,
      visual: false,
      autoresize_overflow_padding: 0,
      autoresize_bottom_margin: 15,
      max_height: 55,
      content_style: `
        html {
          height: 100%;
        }
        body#tinymce {
          margin: 0 12px;
        }
      `
    };
  }

  filterSuggestions(
    suggestions: IMention[],
    pattern,
    selectedMentions: string[] = []
  ) {
    const filteredSuggestions = pattern
      ? suggestions.filter((item) =>
          item.text.toLowerCase().includes(pattern.toLowerCase())
        )
      : [...suggestions];

    return filteredSuggestions
      .sort((a, b) => a.text.localeCompare(b.text))
      .map((item) => {
        const avatar =
          item.image && !item.image.includes('google_avatar')
            ? {
                type: 'cardimage',
                src: item.image,
                classes: ['tox-autocompleter-user-avatar']
              }
            : {
                type: 'cardtext',
                text: this.formatShortName(item?.firstName, item?.lastName),
                classes: ['tox-autocompleter-user-avatar-text']
              };

        return {
          type: 'cardmenuitem',
          value: item.value,
          label: item.text,
          items: [
            {
              type: 'cardcontainer',
              direction: 'horizontal',
              items: [
                {
                  ...avatar
                },
                {
                  type: 'cardtext',
                  text: item.text,
                  name: 'char_name',
                  classes: ['tox-autocompleter-user-name']
                },
                {
                  type: 'cardtext',
                  text: selectedMentions.includes(item.id) ? '✓' : '',
                  classes: ['tox-autocompleter-user-tick']
                }
              ]
            }
          ]
        };
      });
  }

  createMention(value: { userId: string; name: string }) {
    return `<strong data-userid='${
      value?.userId
    }' contenteditable='false'>${value?.name.trim()}</strong>&nbsp;`;
  }

  private formatShortName(firstName: string, lastName: string) {
    const arrName = `${firstName || ''} ${lastName || ''}`.trim().split(' ');
    if (arrName.length >= 2) {
      return arrName[0].charAt(0) + arrName[1].charAt(0);
    } else if (arrName.length === 1) {
      return arrName[0].charAt(0) + (arrName[0]?.charAt(1) || '');
    } else {
      return '';
    }
  }
}
