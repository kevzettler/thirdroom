import { BaseObservableMap } from "@thirdroom/hydrogen-view-sdk";

import { useObservable } from "./useObservable";

// Empty observable that does nothing - used when no Matrix session
class EmptyObservableMap {
  subscribe() { return () => {}; }
  [Symbol.iterator]() { return [][Symbol.iterator](); }
}

export function useObservableMap<K, V>(observableFactory: () => BaseObservableMap<K, V> | undefined, deps: unknown[]): Map<K, V> {
  return useObservable(
    () => observableFactory() ?? new EmptyObservableMap() as unknown as BaseObservableMap<K, V>,
    (update, observable) => ({
      onReset: () => update(new Map(observable)),
      onAdd: () => update(new Map(observable)),
      onUpdate: () => update(new Map(observable)),
      onRemove: () => update(new Map(observable)),
    }),
    (observable) => new Map(observable),
    deps
  );
}
