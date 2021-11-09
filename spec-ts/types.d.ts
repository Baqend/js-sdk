import { binding } from 'baqend';

declare module 'baqend' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface baqend {
    Test:binding.EntityFactory<model.Test>;
  }

  // eslint-disable-next-line no-shadow
  namespace model {
    export interface User extends binding.Entity {
      customUserProp: string;
    }

    export interface Test extends binding.Entity {
      myProp: string;
      file: binding.File;
    }
  }

}
