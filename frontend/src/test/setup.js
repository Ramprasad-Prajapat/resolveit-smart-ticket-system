import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Stub IntersectionObserver for JSDOM
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = window.IntersectionObserver || MockIntersectionObserver;
global.IntersectionObserver = global.IntersectionObserver || MockIntersectionObserver;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
