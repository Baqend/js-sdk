import {model, binding} from '../index';

declare module "../index" {
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


