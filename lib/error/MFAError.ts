import { PersistentError } from './PersistentError';

export class MFAError extends PersistentError {
  /**
  * The Verification Token for the MFA Message
  */
  public readonly token: string;

  constructor(token: string) {
    super('MFA Required');
    this.token = token;
  }
}
