export interface IRefreshTokenResponse {
  id_token: string;
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
}
