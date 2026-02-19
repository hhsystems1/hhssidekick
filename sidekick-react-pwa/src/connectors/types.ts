export type ConnectorProvider = 'google' | 'github' | 'notion' | 'slack';

export interface ConnectorStatus {
  connected: boolean;
  scopes: string[];
  expiresAt?: string;
}

export interface DocumentRecord {
  source: ConnectorProvider;
  externalId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  text?: string;
  url?: string;
  permissions?: string[];
}

export interface ConnectorInterface {
  provider: ConnectorProvider;
  connect: (redirectTo: string) => Promise<{ url: string }>;
  status: () => Promise<ConnectorStatus>;
  disconnect: () => Promise<void>;
}
