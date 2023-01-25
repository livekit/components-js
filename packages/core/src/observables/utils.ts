import Observable from 'zen-observable';

export function observableWithDefault<T>(observable: Observable<T>, startValue: T) {
  return Observable.of(startValue).concat(observable);
}

export function observableWithTrigger<T>(startValue: T) {
  let subObserver: ZenObservable.SubscriptionObserver<T>;
  const observable = Observable.of(startValue).concat(
    new Observable<T>((subscribe) => {
      subObserver = subscribe;
    }),
  );
  // typescript complains here that the variable is used before initialisation, so we do a non-null assertion to get rid
  // of the typescript error but also do a manual runtime null check in order to make sure subObserver is actually assigned
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!subObserver!) {
    throw Error('expected subObserver to be populated');
  }
  return { trigger: subObserver, observable };
}
