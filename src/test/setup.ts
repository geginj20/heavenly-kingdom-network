import { vi } from 'vitest';
import "@testing-library/jest-dom";

const IntersectionObserverMock = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
