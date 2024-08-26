export const HIDDEN_QUOTE_ID = 'sendMessageHiddenQuote';
export const THREE_DOTS_BUTTON_CLASS = 'three-dots__button';
export const REPLY_QUOTE_ID = 'reply_quote';
export const QUOTE_CLASS = 'gmail_quote';

/**
 * Generates a three dots button with optional content.
 * @param {string} [content=''] - The content to be displayed when the button is clicked.
 * @returns {string} - The HTML representation of the generated button and content wrapper.
 */
export const generateThreeDotsButton = (content: string = '') => {
  const quoteContent = `
  <div id='${HIDDEN_QUOTE_ID}' class='quote-wrapper'>
    <div id='${REPLY_QUOTE_ID}' class="${QUOTE_CLASS}" style="padding: 0.8ex 0;border-top: 1px solid #D8DCDF;">
        ${content}
    </div>
  </div>
  `;
  return quoteContent;
};

export const THREE_DOTS_BUTTON_REGEX = new RegExp(
  `<div class="${THREE_DOTS_BUTTON_CLASS}[^]*>[^]*<\/div>`,
  'g'
);

export const HIDDEN_QUOTE_DIV_REGEX = new RegExp(
  `<div id="${HIDDEN_QUOTE_ID}" class="quote-wrapper[^]*>[^]*<\/div>`,
  'g'
);

export function removeReplyQuote(content: string) {
  let newContent = content;

  const arrayMatch = [
    ...(content.match(THREE_DOTS_BUTTON_REGEX) || []),
    ...(content.match(HIDDEN_QUOTE_DIV_REGEX) || [])
  ];
  arrayMatch.forEach((match) => {
    newContent = newContent.replace(match, '');
  });
  return newContent;
}
