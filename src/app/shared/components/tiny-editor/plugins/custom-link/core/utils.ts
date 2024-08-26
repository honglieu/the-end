const isAnchor = (elm: Node | null | undefined): elm is HTMLAnchorElement =>
  elm.nodeName.toLowerCase() === 'a';

export { isAnchor };
