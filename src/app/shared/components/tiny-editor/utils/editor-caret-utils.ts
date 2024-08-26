export function createNewCaret(editor) {
  const fakeCaret = document.createElement('div');
  const line = document.createElement('div');
  const plus = document.createElement('div');
  const img = document.createElement('img');
  fakeCaret.appendChild(plus);
  plus.appendChild(img);
  fakeCaret.appendChild(line);
  fakeCaret.style.position = 'absolute';
  fakeCaret.classList.add('fake_caret');
  fakeCaret.style.display = 'none';
  fakeCaret.style.pointerEvents = 'none';

  line.style.width = '3px';
  line.style.height = '10px';
  line.style.backgroundColor = '#28AD99';
  line.classList.add('fake_caret--line');

  plus.style.width = '10px';
  plus.style.height = '10px';
  plus.style.backgroundColor = '#28AD99';
  plus.style.borderRadius = '50%';
  plus.style.transform = 'translate(-50%,-100%)';
  plus.style.position = 'absolute';
  plus.style.top = '5px';
  plus.style.left = '50%';

  img.src = '../../../../assets/icon/plus-white.svg';
  img.style.width = '8px';
  img.style.height = '8px';
  img.style.position = 'absolute';
  img.style.top = '50%';
  img.style.left = '50%';
  img.style.transform = 'translate(-50%,-50%)';

  const body = editor?.contentDocument?.body;
  body?.appendChild(fakeCaret);
}

export function updateCaretPosition(editor) {
  const body = editor.contentDocument.body;
  const fakeCaret = body.querySelector('.fake_caret') as HTMLElement;
  const line = body.querySelector('.fake_caret--line') as HTMLElement;
  const range = editor.selection.getRng();
  const clientRect = range.getBoundingClientRect();

  const topClientCaret = clientRect.top;

  const leftClientCaret = clientRect.left;

  const heightCaret = clientRect.height;

  if (!heightCaret) {
    clearCaret(editor);
    return;
  }

  if (fakeCaret) {
    fakeCaret.style.display = 'block';
    fakeCaret.style.top =
      topClientCaret + editor.dom.doc.scrollingElement.scrollTop + 'px';
    fakeCaret.style.left = leftClientCaret - 1 + 'px';
  }

  if (line) {
    line.style.height = heightCaret + 'px';
  }
}

export function clearCaret(editor) {
  const body = editor?.contentDocument?.body;
  const fakeCaret = body?.querySelector('.fake_caret') as HTMLElement;
  if (fakeCaret) {
    fakeCaret.remove();
  }
}
