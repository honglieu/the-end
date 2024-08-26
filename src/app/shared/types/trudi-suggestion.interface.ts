import { TrudiButton } from './trudi.interface';

export interface TrudiSuggestionHeader {
  text: string;
}

export interface TrudiSuggestionVariable {}

export interface Body {
  text: string;
  button: TrudiButton[];
  variable: TrudiSuggestionVariable;
}

export interface TrudiSuggestionData {
  isCompleted: boolean;
  header: TrudiSuggestionHeader;
  body: Body;
}

export interface TrudiSuggestion {
  type: string;
  data: TrudiSuggestionData[];
}
