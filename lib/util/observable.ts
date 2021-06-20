import { Observable as ObservableType, Subscription as SubscriptionType, Subscriber as SubscriberType } from 'rxjs';

function optionalRxjsDependency() {
  throw new Error('This functionality is only available, if the optional rxjs dependency is also provided.');
}

let rxjs = {
  Observable: optionalRxjsDependency as any as typeof ObservableType,
  Subscription: optionalRxjsDependency as any as typeof SubscriberType,
  Subscriber: optionalRxjsDependency as any as typeof SubscriberType,
};

try {
  // we load this module as an optional external dependency
  // eslint-disable-next-line global-require
  rxjs = require('rxjs');
} catch (e) {
  // ignore loading optional module error
}

type Observable<T> = ObservableType<T>;
type Subscription = SubscriptionType;
type Subscriber<R> = SubscriberType<R>;

// eslint-disable-next-line @typescript-eslint/no-redeclare
const { Observable, Subscription, Subscriber } = rxjs;

export { Observable, Subscription, Subscriber };
