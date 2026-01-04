import { BaseObservableMap } from "@thirdroom/hydrogen-view-sdk";
import { useMemo } from "react";

import { useObservable } from "./useObservable";

// Empty observable that does nothing - used when no Matrix session
class EmptyObservableMap<K, V> {
  subscribe() { return () => {}; }
  [Symbol.iterator]() { return [][Symbol.iterator](); }
}

export function useObservableMap<K, V>(observableFactory: () => BaseObservableMap<K, V> | undefined, deps: unknown[]): Map<K, V> {
  const hasObservable = useMemo(() => observableFactory() !== undefined, deps);
  
  return useObservable(
    () => observableFactory() ?? new EmptyObservableMap<K, V>() as unknown as BaseObservableMap<K, V>,
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
