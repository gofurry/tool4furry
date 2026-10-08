import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollDock } from '../src/ui/ScrollDock';
import { getScrollMetrics } from '../src/ui/scroll-metrics';

describe('document scroll metrics', () => {
  it.each([
    [0, 0, 0, 0, false, 0],
    [0, 1000, 1000, 0, false, 0],
    [100, 500, 1000, 0, false, 0],
    [-20, 3000, 1000, 0, false, 0],
    [72, 3000, 1000, 4, false, 0],
    [73, 3000, 1000, 4, true, 0],
    [200, 1320, 1000, 63, false, 120],
    [1000, 3000, 1000, 50, true, 500],
    [3000, 3000, 1000, 100, true, 1500],
    [NaN, Infinity, 1000, 0, false, 0],
  ])(
    'clamps geometry (%s, %s, %s)',
    (top, height, viewport, percent, canShow, stepTarget) => {
      expect(
        getScrollMetrics(top as number, height as number, viewport as number),
      ).toMatchObject({ percent, canShow, stepTarget });
    },
  );
});

let restoreGeometry: (() => void) | undefined;
afterEach(() => {
  restoreGeometry?.();
  restoreGeometry = undefined;
});

function environment() {
  const geometry = {
    top: 1000,
    height: 3000,
    viewport: 1000,
    desktop: true,
    reduced: false,
  };
  const root = document.documentElement;
  const originalHeight = Object.getOwnPropertyDescriptor(root, 'scrollHeight');
  const originalViewport = Object.getOwnPropertyDescriptor(
    root,
    'clientHeight',
  );
  Object.defineProperty(root, 'scrollHeight', {
    configurable: true,
    get: () => geometry.height,
  });
  Object.defineProperty(root, 'clientHeight', {
    configurable: true,
    get: () => geometry.viewport,
  });
  restoreGeometry = () => {
    if (originalHeight)
      Object.defineProperty(root, 'scrollHeight', originalHeight);
    else Reflect.deleteProperty(root, 'scrollHeight');
    if (originalViewport)
      Object.defineProperty(root, 'clientHeight', originalViewport);
    else Reflect.deleteProperty(root, 'clientHeight');
  };
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => geometry.top);
  const frames = new Map<number, FrameRequestCallback>();
  let sequence = 0;
  const request = vi.fn((callback: FrameRequestCallback) => {
    frames.set(++sequence, callback);
    return sequence;
  });
  const cancel = vi.fn((id: number) => frames.delete(id));
  vi.stubGlobal('requestAnimationFrame', request);
  vi.stubGlobal('cancelAnimationFrame', cancel);
  const scrollTo = vi.fn();
  vi.stubGlobal('scrollTo', scrollTo);
  const mediaListeners = new Set<() => void>();
  const removeMedia = vi.fn((_: string, listener: () => void) =>
    mediaListeners.delete(listener),
  );
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('reduced-motion')
        ? geometry.reduced
        : geometry.desktop;
    },
    addEventListener: (_: string, listener: () => void) =>
      mediaListeners.add(listener),
    removeEventListener: removeMedia,
  }));
  let resized = () => {};
  const observe = vi.fn();
  const disconnect = vi.fn();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resized = callback;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
  const flush = () =>
    act(() => {
      const current = [...frames.values()];
      frames.clear();
      current.forEach((callback) => callback(0));
    });
  return {
    geometry,
    request,
    cancel,
    frames,
    scrollTo,
    mediaListeners,
    removeMedia,
    observe,
    disconnect,
    resizeContent: () => resized(),
    flush,
  };
}

const getLabel = (progress: number) =>
  `Scroll up, current progress ${progress}%`;
describe('ScrollDock', () => {
  it('coalesces document events, reports rounded progress and ignores internal panel scrolling', () => {
    const env = environment();
    const label = vi.fn(getLabel);
    const { container } = render(
      <>
        <ScrollDock getLabel={label} />
        <div data-panel />
      </>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    fireEvent.scroll(document);
    fireEvent.scroll(document);
    expect(env.request).toHaveBeenCalledTimes(1);
    env.flush();
    expect(screen.getByRole('button', { name: getLabel(50) })).toBeTruthy();
    expect(
      container
        .querySelector('[stroke-dashoffset]')
        ?.getAttribute('stroke-dashoffset'),
    ).toBe('50');
    label.mockClear();
    env.geometry.top = 1001;
    fireEvent.scroll(document);
    env.flush();
    expect(label).not.toHaveBeenCalled();
    env.geometry.top = 1500;
    fireEvent.scroll(container.querySelector('[data-panel]')!, {
      bubbles: true,
    });
    expect(env.frames.size).toBe(0);
    expect(env.scrollTo).not.toHaveBeenCalled();
    fireEvent.scroll(document);
    env.flush();
    expect(screen.getByRole('button', { name: getLabel(75) })).toBeTruthy();
  });
  it('hides at the top, on short pages or without desktop fine pointer; observes content growth', () => {
    const env = environment();
    env.geometry.top = 0;
    render(<ScrollDock getLabel={getLabel} />);
    env.flush();
    expect(screen.queryByRole('button')).toBeNull();
    env.geometry.top = 500;
    fireEvent.scroll(document);
    env.flush();
    expect(screen.getByRole('button')).toBeTruthy();
    env.geometry.desktop = false;
    act(() => env.mediaListeners.forEach((listener) => listener()));
    env.flush();
    expect(screen.queryByRole('button')).toBeNull();
    env.geometry.desktop = true;
    env.geometry.height = 1200;
    fireEvent.resize(window);
    env.flush();
    expect(screen.queryByRole('button')).toBeNull();
    env.geometry.height = 3000;
    env.resizeContent();
    env.flush();
    expect(screen.getByRole('button', { name: getLabel(25) })).toBeTruthy();
    expect(env.observe.mock.calls.map(([target]) => target)).toEqual([
      document.documentElement,
      document.body,
    ]);
  });
  it('moves up a quarter of total distance with pointer or keyboard and honors reduced motion', async () => {
    const env = environment();
    const user = userEvent.setup();
    render(<ScrollDock getLabel={getLabel} />);
    env.flush();
    const button = screen.getByRole('button');
    await user.click(button);
    expect(env.scrollTo).toHaveBeenLastCalledWith({
      top: 500,
      behavior: 'smooth',
    });
    env.geometry.top = 200;
    env.geometry.reduced = true;
    await user.keyboard('{Enter}');
    expect(env.scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      behavior: 'instant',
    });
    env.geometry.top = 2000;
    await user.keyboard(' ');
    expect(env.scrollTo).toHaveBeenLastCalledWith({
      top: 1500,
      behavior: 'instant',
    });
  });
  it('removes listeners, disconnects observation and cancels pending work on unmount', () => {
    const env = environment();
    const add = vi.spyOn(document, 'addEventListener');
    const addWindow = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const removeWindow = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<ScrollDock getLabel={getLabel} />);
    const scrollListener = add.mock.calls.find(
      ([event]) => event === 'scroll',
    )!;
    const resizeListener = addWindow.mock.calls.find(
      ([event]) => event === 'resize',
    )!;
    expect(scrollListener[2]).toEqual({ passive: true });
    env.flush();
    fireEvent.scroll(document);
    const pending = [...env.frames.keys()][0];
    unmount();
    expect(remove).toHaveBeenCalledWith('scroll', scrollListener[1]);
    expect(removeWindow).toHaveBeenCalledWith('resize', resizeListener[1]);
    expect(env.removeMedia).toHaveBeenCalledTimes(1);
    expect(env.mediaListeners.size).toBe(0);
    expect(env.disconnect).toHaveBeenCalledOnce();
    expect(env.cancel).toHaveBeenCalledWith(pending);
    expect(env.frames.size).toBe(0);
    fireEvent.scroll(document);
    expect(env.frames.size).toBe(0);
  });
});
