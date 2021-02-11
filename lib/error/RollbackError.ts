import { PersistentError } from './PersistentError';

export class RollbackError extends PersistentError {
  constructor(cause: Error) {
    super('The transaction has been roll backed', cause);
  }
}
