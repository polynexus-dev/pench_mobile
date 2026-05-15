import { create, StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export function createStore<T>(
  name: string,
  initializer: StateCreator<T, [["zustand/immer", never]], []>,
) {
  return create<T>()(devtools(immer(initializer), { name, enabled: __DEV__ }));
}
