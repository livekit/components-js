import { ref, Ref, onMounted, onUnmounted } from 'vue';
import { Observable, Subscription } from 'rxjs';

export function useObservable<T>(observable: Observable<T>, startWith: T) {
  const state = ref<T>(startWith) as Ref<T>;
  let subscription: Subscription | undefined;
  onMounted(() => {
    subscription = observable.subscribe((val) => (state.value = val));
  });
  onUnmounted(() => {
    subscription?.unsubscribe();
  });
  return state;
}
