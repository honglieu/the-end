import { IsHTMLPipe } from './is-html.pipe';

describe('IsHTMLPipe', () => {
  let pipe;

  beforeEach(() => {
    pipe = new IsHTMLPipe();
  });

  it('should is true', async () => {
    expect(pipe.transform('<div>Test</div>')).toEqual(true);
  });

  it('should is false', async () => {
    expect(pipe.transform('Test plain text')).toEqual(false);
  });
});
