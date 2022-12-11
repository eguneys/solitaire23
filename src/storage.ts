interface StorageHelper {
  make(k: string): CustomStorage;
  get(k: string): string | null;
  set(k: string, v: string): void;
  remove(k: string): void;
}
interface CustomStorage {
  get(): string | null;
  set(v: any): void;
  remove(): void;
}
export const defined = <T>(value: T | undefined): value is T => value !== undefined
const builder = (storage: Storage): StorageHelper => {
  const api = {
    get: (k: string) => storage.getItem(k),
      set: (k: string, v: string) => storage.setItem(k,v),
      remove: (k: string) => storage.removeItem(k),
      make: (k: string) => ({
      get: () => api.get(k),
        set: (v: any) => api.set(k, v),
        remove: () => api.remove(k)
    }),
    makeBoolean: (k: string) => ({
      get: () => api.get(k) == '1',
        set: (v: boolean): void => api.set(k, v ? '1' : '0'),
        toggle: () => api.set(k, api.get(k) == '1' ? '0' : '1')
    })
  }
  return api
}
export const storage = builder(window.localStorage)
export interface StoredJsonProp<T> {
  (): T;
  (v: T): T;
}
export const storedJsonProp =
  <T>(key: string, defaultValue: () => T): StoredJsonProp<T> =>
(v?: T) => {
  if (defined(v)) {
    storage.set(key, JSON.stringify(v)!)
    return v
  }
  const ret = JSON.parse(storage.get(key)!)
  return ret !== null ? ret : defaultValue()

}
