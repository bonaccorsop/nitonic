import { Filesystem as FS } from '../filesystem/filesystem';
import { isNil } from 'lodash';

export interface Credentials {
  codiceFiscale: string;
  bearer: string;
  userId: string;
  userSecret: string;
}

export class CredentialsService {
  private credentialsFile = 'secrets.json';

  constructor() {
    this.provisionCredentials();
  }

  provisionCredentials(): void {
    if (!FS.fileExists(this.credentialsFile)) {
      FS.writeJson(this.credentialsFile, {
        codiceFiscale: null,
        bearer: null,
        userId: null,
        userSecret: null,
      });
    }
  }

  setCodiceFiscale(codiceFiscale: string): void {
    const credentials = this.getCredentials();
    FS.writeJson(this.credentialsFile, {
      ...credentials,
      codiceFiscale: codiceFiscale.toLocaleUpperCase(),
    });
  }

  setBearer(bearer: string): void {
    const credentials = this.getCredentials();
    FS.writeJson(this.credentialsFile, {
      ...credentials,
      bearer,
    });
  }

  setUserId(userId: string): void {
    const credentials = this.getCredentials();
    FS.writeJson(this.credentialsFile, {
      ...credentials,
      userId,
    });
  }

  setUserSecret(userSecret: string): void {
    const credentials = this.getCredentials();
    FS.writeJson(this.credentialsFile, {
      ...credentials,
      userSecret: Buffer.from(userSecret).toString('base64'),
    });
  }

  getCredentials(): Credentials {
    return FS.readJson<Credentials>(this.credentialsFile);
  }

  getCodiceFiscale(): string {
    const credentials = this.getCredentials();
    return credentials.codiceFiscale;
  }

  getBearer(): string {
    const credentials = this.getCredentials();
    return credentials.bearer;
  }

  getUserId(): string {
    const credentials = this.getCredentials();
    return credentials.userId;
  }

  getUserSecret(): string {
    const credentials = this.getCredentials();
    return Buffer.from(credentials.userSecret, 'base64').toString('ascii');
  }

  isCodiceFiscaleSet(): boolean {
    return !isNil(this.getCredentials().codiceFiscale);
  }

  deleteCredentials(): void {
    FS.deleteFile(this.credentialsFile);
  }
}
