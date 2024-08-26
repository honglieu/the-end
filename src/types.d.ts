declare interface Window {
  loader: {
    ajaxindicatorstart: (content?: string) => void;
    ajaxindicatorstop: () => void;
  };
  gtag: typeof ga;
  zESettings: any;
  zE: any;
  google: {
    accounts: {
      oauth2: {
        initCodeClient: (options: {
          client_id: string;
          scope: string;
          ux_mode: string;
          select_account: boolean;
          redirect_uri: string;
          callback: (res: { code: string }) => void;
          error_callback: (error: any) => void;
        }) => { requestCode: () => void };
      };
    };
  };
}
