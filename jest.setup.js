// AsyncStorage ships ESM only and has no native module under Jest, so the
// library/persistence tests get a tiny in-memory implementation.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
      setItem: jest.fn(async (key, value) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async key => {
        store.delete(key);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
    },
  };
});
