import { useEffect, useState } from "react";
import { subscribe } from "@/domain/store";

/**
 * Subscribes a component to the local case store and re-derives `read()`
 * on every mutation. `read` is called on mount and after each notify().
 * The effect depends on `read` so it re-sets up the subscription if the
 * read function changes (e.g. a different selector).
 */
export function useStore<T>(read: () => T): T {
  const [value, setValue] = useState<T>(() => read());
  useEffect(() => {
    const unsubscribe = subscribe(() => setValue(read()));
    return () => unsubscribe();
  }, [read]);
  return value;
}