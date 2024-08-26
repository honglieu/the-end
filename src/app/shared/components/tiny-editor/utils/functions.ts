import { CUSTOMIZE_FONT_STYLE_CLASS } from '@/app/shared/components/tiny-editor/utils/font-utils';
import { extractQuoteAndMessage } from '@/app/trudi-send-msg/utils/helper-functions';
import * as HTMLParser from 'node-html-parser';

export const IMAGE_LOADING_REGEX =
  /<img id="[^"]*" class="image-loading" src="\/assets\/images\/loading-iframe.gif">/g;

export function setHeightCommunicationWrapper() {
  const headerAndFooterHeight = 277;
  const contentHeight = window.innerHeight - headerAndFooterHeight;
  const wraper = document.querySelector(
    '.communication-form-wrapper'
  ) as HTMLElement;
  if (!wraper?.offsetHeight) return;
  const toxTinyMceEle = document.querySelector(
    '.tiny-editor-container .tiny-editor-modal .tox-tinymce'
  ) as HTMLElement;
  if (wraper.offsetHeight < contentHeight) {
    wraper.style.height = '100%';
    if (!toxTinyMceEle?.style) return;
    toxTinyMceEle.style.setProperty('max-height', '360px', 'important');
    toxTinyMceEle.style.setProperty('height', '360px');
  } else {
    wraper.style.height = 'auto';
    if (!toxTinyMceEle?.style) return;
    toxTinyMceEle.style.setProperty('max-height', '250px', 'important');
    toxTinyMceEle.style.setProperty('height', '250px', 'important');
  }
}

export function replaceImageLoading(value: string) {
  return value.replace(IMAGE_LOADING_REGEX, '');
}

export function initializeImageErrorHandler(editor) {
  const errorHandler = (event: Event) => {
    if ((event.target as HTMLElement).tagName === 'IMG') {
      handleImageError(event.target as HTMLImageElement);
    }
  };
  editor.contentDocument.addEventListener('error', errorHandler, true);
  editor._imageErrorHandler = errorHandler;
}
export function handleImageError(imgElement: HTMLImageElement) {
  imgElement.src = '/assets/icon/icon-loading-image.svg';
}

export function removeImageErrorHandler(editor) {
  if (editor._imageErrorHandler) {
    editor.contentDocument.removeEventListener(
      'error',
      editor._imageErrorHandler,
      true
    );
    editor._imageErrorHandler = null;
  }
}

export function removeLineHeight(content: string) {
  return content?.replace(/(line-height)\s*?:\s*([^;>]*)[;]/g, '');
}

export function findMatchingElement(elementTarget, exceptions) {
  return exceptions
    .map(
      (exception) =>
        elementTarget.closest(`.${exception}`) ||
        (!!elementTarget.className?.includes &&
          elementTarget.className?.includes(exception))
    )
    .filter(Boolean);
}

export function hasElementInDocument(exceptions: string[]): boolean {
  return exceptions.some((exception) => {
    const element = document.querySelector(exception);
    return Boolean(element);
  });
}

export function checkCustomStyle(message: string) {
  const hasCustomStyle = message.indexOf(`${CUSTOMIZE_FONT_STYLE_CLASS}`) > 0;
  return hasCustomStyle;
}

export function extractContentFromCustomStyle(message: string) {
  let content = message;
  let wrapper: HTMLParser.HTMLElement;
  const hasCustomStyle = checkCustomStyle(message);
  if (hasCustomStyle) {
    const rootEl = HTMLParser.parse(content);
    wrapper = rootEl.childNodes[0] as HTMLParser.HTMLElement;
    const innerEl = wrapper.innerHTML;
    wrapper.innerHTML = '';
    content = innerEl;
  }
  return { content, wrapper };
}

export function removeLastWhiteSpaceFromContent(content: string) {
  try {
    const { content: innerContent, wrapper } =
      extractContentFromCustomStyle(content);
    const array = innerContent.split('\n');
    let index = array.length - 1;
    array.reverse();
    for (const item of array) {
      const regex =
        /<p>([(&nbsp;|\s)]{1,}|<span[\s\w\W]{1,}>[(&nbsp;|\s)]{1,}<\/span>)<\/p>/g;
      const test = regex.test(item);
      if (!test) break;
      index--;
    }
    let newIndex = index + 1;
    let newArray = array.reverse().slice(0, newIndex);
    let startIndex = 0;
    for (const item of newArray) {
      const regex =
        /<p>([(&nbsp;|\s)]{1,}|<span[\s\w\W]{1,}>[(&nbsp;|\s)]{1,}<\/span>)<\/p>/g;
      const test = regex.test(item);
      if (!test) break;
      startIndex++;
    }
    newArray = newArray.slice(startIndex);
    let newContent = newArray.join('\n');
    if (wrapper) {
      wrapper.innerHTML = newContent;
      newContent = wrapper.outerHTML;
    }
    return newContent;
  } catch (err) {
    console.error(err);
    return content;
  }
}

export function handleSelectionContentHasNonEditable(editor) {
  editor.getBody().addEventListener('click', (event) => {
    const target = event?.target as HTMLElement;
    if (target && target.getAttribute('contenteditable') === 'false') {
      editor.selection.select(target);
    }
  });
}
