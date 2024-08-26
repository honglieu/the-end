const link = (): RegExp =>
  // eslint-disable-next-line max-len
  /(?:[A-Za-z][A-Za-z\d.+-]{0,14}:\/\/(?:[-.~*+=!&;:'%@?^${}(),\w]+@)?|www\.|[-;:&=+$,.\w]+@)[A-Za-z\d-]+(?:\.[A-Za-z\d-]+)*(?::\d+)?(?:\/(?:[-.~*+=!;:'%@$(),\/\w]*[-~*+=%@$()\/\w])?)?(?:\?(?:[-.~*+=!&;:'%@?^${}(),\/\w]+))?(?:#(?:[-.~*+=!&;:'%@?^${}(),\/\w]+))?/g;

jest.mock('@ephox/polaris', () => ({
  Regexes: jest.fn()
}));

jest.mock('@ephox/katamari', () => ({
  Unicode: jest.fn(),
  Fun: jest.fn(),
  Obj: jest.fn(),
  Strings: jest.fn(),
  Type: jest.fn()
}));
