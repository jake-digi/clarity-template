import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => { },
  }),
});
Object.defineProperty(window, "ipcRenderer", {
  value: {
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
    invoke: vi.fn().mockResolvedValue(undefined),
  },
});

Object.defineProperty(window, "electron", {
  value: {
    ipcRenderer: window.ipcRenderer,
    platform: "darwin",
  },
});
