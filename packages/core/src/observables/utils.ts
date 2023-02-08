import Observable from 'zen-observable';
import { merge } from 'zen-observable/extras';
export function observableWithStartValue<T>(observable: Observable<T>, startValue: T) {
  return Observable.of(startValue).concat(observable);
}

export function observableWithTrigger<T>(startValue: T) {
  let subObserver: ZenObservable.SubscriptionObserver<T>;
  const triggerObservable = new Observable<T>((subscribe) => {
    subObserver = subscribe;
  });
  const observable = merge(Observable.of(startValue), triggerObservable);
  // typescript complains here that the variable is used before initialization, so we do a non-null assertion to get rid
  // of the typescript error but also do a manual runtime null check in order to make sure subObserver is actually assigned
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!subObserver!) {
    throw Error('expected subObserver to be populated');
  }
  return { trigger: subObserver, observable };
}

export function ofAsync<T>(promise: Promise<T>) {
  const handler = async (subscriber: ZenObservable.SubscriptionObserver<T>) => {
    const result = await promise;
    subscriber.next(result);
    subscriber.complete();
  };
  return new Observable((subscriber) => {
    handler(subscriber);
  });
}
