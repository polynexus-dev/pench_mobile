import { create, StateCreator } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export function createStore<T>(
  name: string,
  initializer: StateCreator<T, [["zustand/immer", never]], []>,
) {
  return create<T>()(devtools(immer(initializer), { name, enabled: __DEV__ }));
}

// import { create, StateCreator } from "zustand";
// import { devtools, persist, createJSONStorage } from "zustand/middleware";
// import { immer } from "zustand/middleware/immer";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export function createStore<T>(
//   name: string,
//   initializer: StateCreator<T, [["zustand/immer", never]], []>,
// ) {
//   return create<T>()(devtools(immer(initializer), { name, enabled: __DEV__ }));
// }

// export type HydratableState = {
//   hasHydrated: boolean;
//   setHasHydrated: (value: boolean) => void;
// };

// export function createPersistedStore<T extends HydratableState>(
//   name: string,
//   initializer: StateCreator<T, [["zustand/immer", never]], []>,
//   partialize?: (state: T) => Partial<T>,
// ) {
//   return create<T>()(
//     devtools(
//       persist(immer(initializer), {
//         name: `${name}-storage`,
//         storage: createJSONStorage(() => AsyncStorage),
//         partialize,
//         onRehydrateStorage: () => (state) => {
//           state?.setHasHydrated(true);
//         },
//       }),
//       { name, enabled: __DEV__ }
//     )
//   );
// }