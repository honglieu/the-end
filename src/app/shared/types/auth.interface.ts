export interface IRememberStore {
  error?: {
    message?: string;
  };
  data?: IRememberData;
}

export interface IRememberData {
  email?: string;
  password?: string;
  rememberMe?: boolean;
}
