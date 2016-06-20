declare var DB: baqend.EntityManager;

type json = Object;

interface Class<T> {
    new(...args: Array<any>): T;
}

