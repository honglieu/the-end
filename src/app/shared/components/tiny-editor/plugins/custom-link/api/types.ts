export const enum AssumeExternalTargets {
  OFF,
  WARN,
  ALWAYS_HTTP = 'http',
  ALWAYS_HTTPS = 'https'
}

export interface IActiveLink {
  url: string;
  title?: string;
}
