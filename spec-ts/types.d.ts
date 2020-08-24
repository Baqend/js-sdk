import {model, binding} from '../esm/lib/index.es2015';

declare module "../esm/lib/index.es2015" {
    interface baqend {
        Test:binding.EntityFactory<model.Test>;
    }

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


