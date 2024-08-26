import { Obj } from '@ephox/katamari';
import * as HTMLParser from 'node-html-parser';
import { Editor } from 'tinymce';
export enum ColorFormat {
  forecolor = 'forecolor',
  hilitecolor = 'hilitecolor'
}
export enum FortmatStyleType {
  'FontName' = 'FontName',
  'FontSize' = 'FontSize',
  'ForeColor' = 'ForeColor',
  'BackColor' = 'BackColor'
}

export const systemStackFonts = ['Inter', 'sans-serif'];

export type FontSelectItem = {
  title: string;
  format: string;
};

export const defaultFontFamily: FontSelectItem = {
  title: 'Inter',
  format: 'inter,sans-serif'
};

export const listFontFamilies: FontSelectItem[] = [
  defaultFontFamily,
  {
    title: 'Andale Mono',
    format: 'andale mono,monospace'
  },
  {
    title: 'Arial',
    format: 'arial,helvetica,sans-serif'
  },
  {
    title: 'Arial Black',
    format: 'arial black,sans-serif'
  },
  {
    title: 'Book Antiqua',
    format: 'book antiqua,palatino,serif'
  },
  {
    title: 'Comic Sans MS',
    format: 'comic sans ms,sans-serif'
  },
  {
    title: 'Courier New',
    format: 'courier new,courier,monospace'
  },
  {
    title: 'Georgia',
    format: 'georgia,palatino,serif'
  },
  {
    title: 'Helvetica',
    format: 'helvetica,arial,sans-serif'
  },
  {
    title: 'Impact',
    format: 'impact,sans-serif'
  },
  {
    title: 'Symbol',
    format: 'symbol'
  },
  {
    title: 'Tahoma',
    format: 'tahoma,arial,helvetica,sans-serif'
  },
  {
    title: 'Terminal',
    format: 'terminal,monaco,monospace'
  },
  {
    title: 'Times New Roman',
    format: 'times new roman,times,serif'
  },
  {
    title: 'Trebuchet MS',
    format: 'trebuchet ms,geneva,sans-serif'
  },
  {
    title: 'Verdana',
    format: 'verdana,geneva,sans-serif'
  },
  {
    title: 'Webdings',
    format: 'webdings'
  },
  {
    title: 'Wingdings',
    format: 'wingdings,zapf dingbats'
  }
];

export const defaultFontSize: FontSelectItem = {
  title: '11pt',
  format: '11pt'
};

export const listFontSizes: FontSelectItem[] = [
  {
    title: '8pt',
    format: '8pt'
  },
  {
    title: '9pt',
    format: '9pt'
  },
  {
    title: '10pt',
    format: '10pt'
  },
  {
    title: '11pt',
    format: '11pt'
  },
  {
    title: '12pt',
    format: '12pt'
  },
  {
    title: '14pt',
    format: '14pt'
  },
  {
    title: '16pt',
    format: '16pt'
  },
  {
    title: '18pt',
    format: '18pt'
  },
  {
    title: '20pt',
    format: '20pt'
  }
];
export const defaultBackgroundColor = {
  title: '',
  format: ''
};
export const listBackgroundColor = [
  { title: '#FFE7CF', format: '#FFE7CF' },
  { title: '#FFC7C7', format: '#FFC7C7' },
  { title: '#B2DDFF', format: '#B2DDFF' },
  { title: '#A9EFC5', format: '#A9EFC5' },
  { title: '#FAD8A5', format: '#FAD8A5' }
];
export const defaultTextColor = { title: '#3D3D3D', format: '#3D3D3D' };
export const listTextColor = [
  { title: '#FFFFFF', format: '#FFFFFF' },
  { title: '#3D3D3D', format: '#3D3D3D' },
  { title: '#00AA9F', format: '#00AA9F' },
  { title: '#2E90FA', format: '#2E90FA' },
  { title: '#FA3939', format: '#FA3939' }
];
export function matchesStack(fonts: string[], stack: string[]): boolean {
  return (
    stack.length > 0 &&
    stack.every((font) => fonts.indexOf(font.toLowerCase()) > -1)
  );
}

export function splitFonts(fontFamily: string): string[] {
  const fonts = fontFamily.split(/\s*,\s*/);
  return fonts.map((font) => font.replace(/^['"]+|['"]+$/g, ''));
}

export function isSystemFontStack(
  fontFamily: string,
  userStack: string[]
): boolean {
  if (fontFamily.indexOf('-apple-system') === 0 || userStack.length > 0) {
    const fonts = splitFonts(fontFamily.toLowerCase());
    return (
      matchesStack(fonts, systemStackFonts) || matchesStack(fonts, userStack)
    );
  } else {
    return false;
  }
}

export function getFirstFont(fontFamily: string | undefined) {
  return fontFamily ? splitFonts(fontFamily)[0] : '';
}

// See https://websemantics.uk/articles/font-size-conversion/ for conversions
const legacyFontSizes: Record<string, string> = {
  '8pt': '1',
  '10pt': '2',
  '12pt': '3',
  '14pt': '4',
  '18pt': '5',
  '24pt': '6',
  '36pt': '7'
};

// Note: 'xx-small', 'x-small' and 'large' are rounded up to nearest whole pt
const keywordFontSizes: Record<string, string> = {
  'xx-small': '7pt',
  'x-small': '8pt',
  small: '10pt',
  medium: '12pt',
  large: '14pt',
  'x-large': '18pt',
  'xx-large': '24pt'
};

const round = (number: number, precision: number) => {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
};

export function convertFontSizeToPt(
  fontSize: string,
  precision?: number
): string {
  if (/[0-9.]+px$/.test(fontSize)) {
    // Round to the nearest 0.5
    return round((parseInt(fontSize, 10) * 72) / 96, precision || 0) + 'pt';
  } else {
    return Obj.get(keywordFontSizes, fontSize).getOr(fontSize);
  }
}

export function convertFontSizeToLegacy(fontSize: string): string {
  return Obj.get(legacyFontSizes, fontSize).getOr('');
}
const getDefaultValueFormat = (fontType: FortmatStyleType) => {
  switch (fontType) {
    case FortmatStyleType.FontName:
      return defaultFontFamily.format;
    case FortmatStyleType.FontSize:
      return defaultFontSize.format;
    case FortmatStyleType.ForeColor:
      return defaultTextColor.format;
    case FortmatStyleType.BackColor:
      return defaultBackgroundColor.format;
    default:
      return '';
  }
};
const getRegexFormat = (type: FortmatStyleType) => {
  switch (type) {
    case FortmatStyleType.FontName:
      return /(font-family)\s*?:\s*([^;]*)(;|(?=""|'|;))/g;
    case FortmatStyleType.FontSize:
      return /(font-size)\s*?:\s*([^;]*)(;|(?=""|'|;))/g;
    case FortmatStyleType.ForeColor:
      return /(?:^|;)\s*(?<![\w-])color\s*:\s*([^;]+)/gi;
    case FortmatStyleType.BackColor:
      return /(background-color)\s*?:\s*([^;]*)(;|(?=""|'|;))/g;
    default:
      return /(font-family)\s*?:\s*([^;]*)(;|(?=""|'|;))/g;
  }
};

export function getMatchingStyles(
  htmlContent: string,
  type: FortmatStyleType,
  defaultValue?: string
): string[] {
  try {
    const parsedHTML = HTMLParser.parse(htmlContent);
    const currentDefaultValue = defaultValue ?? getDefaultValueFormat(type);
    let matchedStyles = [];
    const isColorType = [
      FortmatStyleType.ForeColor,
      FortmatStyleType.BackColor
    ].includes(type);
    const getMatchesByNodes = (
      nodes: HTMLParser.Node[],
      inheritVal?: string
    ) => {
      nodes.forEach((node) => {
        if (node.nodeType === HTMLParser.NodeType.TEXT_NODE) {
          if (
            node.innerText !== '' &&
            node.innerText !== ' ' &&
            node.innerText !== '\n' &&
            (inheritVal || isColorType)
          ) {
            matchedStyles.push(inheritVal);
          }
        } else if (node.nodeType === HTMLParser.NodeType.ELEMENT_NODE) {
          const nodeStyle = (node as HTMLParser.HTMLElement).getAttribute(
            'style'
          );
          let matchVal = inheritVal;
          if (nodeStyle) {
            const regexFF = getRegexFormat(type);

            let m: RegExpExecArray = null;

            while ((m = regexFF.exec(nodeStyle)) !== null) {
              // This is necessary to avoid infinite loops with zero-width matches
              if (m.index === regexFF.lastIndex) {
                regexFF.lastIndex++;
              }
              matchVal = m[2];
            }
          }

          if (node.childNodes.length > 0) {
            getMatchesByNodes(node.childNodes, matchVal);
          } else if (matchVal || isColorType) {
            matchedStyles.push(matchVal);
          }
        }
      });
    };

    getMatchesByNodes(parsedHTML.childNodes, currentDefaultValue);
    return [...new Set(matchedStyles)];
  } catch (err) {
    console.log('Parse HTML error: ', err);
    return [];
  }
}
// Check if a given background color is valid and non-transparent
const isValidBackgroundColor = (value) => {
  const rgba = parseRgba(value);
  return rgba && rgba.alpha !== 0;
};

// Parse RGBA color string to an object
const parseRgba = (color) => {
  const match = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
  );
  if (match) {
    return {
      red: parseInt(match[1], 10),
      green: parseInt(match[2], 10),
      blue: parseInt(match[3], 10),
      alpha: match[4] !== undefined ? parseFloat(match[4]) : 1
    };
  }
  return null;
};

// Convert RGBA object to hex color string
const rgbaToHex = ({ red, green, blue }) => {
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

// Climb up the DOM tree to find the closest non-transparent background color
const getClosestCssBackgroundColorValue = (element) => {
  let currentElement = element;
  while (currentElement && currentElement !== document.documentElement) {
    const color = getCss(currentElement, 'background-color');
    if (isValidBackgroundColor(color)) {
      return color;
    }
    currentElement = currentElement.parentElement;
  }
  return defaultBackgroundColor.format;
};

const getCss = (element: Element, property: string) => {
  const styles = window.getComputedStyle(element);
  return styles.getPropertyValue(property);
};
// Get the current text or background color in the TinyMCE editor
export const getCurrentColor = (editor: Editor, format) => {
  const startNode = editor.selection.getStart();
  const cssRgbValue =
    format === ColorFormat.hilitecolor
      ? getClosestCssBackgroundColorValue(startNode)
      : getCss(startNode, 'color');
  const rgba = parseRgba(cssRgbValue);
  return rgba ? rgbaToHex(rgba) : null;
};

export const APPLY_CUSTOM_FONT_EVENT = 'applyCustomFont';

export const CUSTOMIZE_FONT_STYLE_CLASS = 'customize-font-style';
