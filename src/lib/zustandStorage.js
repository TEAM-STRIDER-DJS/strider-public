import { mmkv } from "./mmkv";

export const zustandStorage = {
  getItem: (name) => {
    const value = mmkv.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name, value) => {
    mmkv.set(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    mmkv.delete(name);
  },
};
