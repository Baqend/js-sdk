import {model, binding} from '../lib/baqend';

declare module "../lib/baqend" {
    interface baqend {
        Test:binding.EntityFactory<model.Test>;
    }

    namespace model {
        export interface User extends binding.Entity {
            customUserProp: string;
        }

        export interface Test extends binding.Entity {
            myProp: string;
        }
    }

}


