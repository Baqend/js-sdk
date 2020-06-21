import { Observable as ObservableType, Subscription as SubscriptionType, Subscriber as SubscriberType } from "rxjs";

function optionalRxjsDependency() {
    throw new Error("This functionality is only available, if the optional rxjs dependency is also provided.");
}

let rxjs = {
    Observable: optionalRxjsDependency as any as typeof ObservableType,
    Subscription: optionalRxjsDependency as any as typeof SubscriberType,
    Subscriber: optionalRxjsDependency as any as typeof SubscriberType
};

try {
    // we load this module as an optional external dependency
    rxjs = require("rxjs");
} catch (e) {}

type Observable<T> = ObservableType<T>;
type Subscription = SubscriptionType;
type Subscriber<R> = SubscriberType<R>;

const { Observable, Subscription, Subscriber } = rxjs;

export { Observable, Subscription, Subscriber };