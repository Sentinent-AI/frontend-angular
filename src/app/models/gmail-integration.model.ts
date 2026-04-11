export interface GmailConnectionState {
  connected: boolean;
  email?: string;
  name?: string;
  lastConnectedAt?: Date;
}
