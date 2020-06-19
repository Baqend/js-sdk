'use strict';

import v4 from "uuid/v4";

const uuid = v4 as uuid;
interface uuid {
    /**
     * Generates a new Universally Unique Identifier (UUID) version 4.
     *
     * @return  A generated version 4 UUID.
     */
    (): string
}
export { uuid };

