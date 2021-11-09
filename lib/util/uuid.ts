import { v4 } from 'uuid';

const uuid = v4 as uuid;

// eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-redeclare
interface uuid {
  /**
     * Generates a new Universally Unique Identifier (UUID) version 4.
     *
     * @return  A generated version 4 UUID.
     */
  (): string
}
export { uuid };
