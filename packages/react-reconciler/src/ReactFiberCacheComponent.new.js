/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ReactContext } from 'shared/ReactTypes';

import { enableCache } from 'shared/ReactFeatureFlags';
import { REACT_CONTEXT_TYPE } from 'shared/ReactSymbols';

import * as Scheduler from 'scheduler';
import { popProvider, pushProvider } from './ReactFiberNewContext.new';

// In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
const AbortControllerLocal = enableCache
  ? typeof AbortController !== 'undefined'
    ? AbortController
    : (function AbortControllerShim() {
        const listeners = [];
        const signal = (this.signal = {
          aborted: false,
          addEventListener: (type, listener) => {
            listeners.push(listener);
          },
        });

        this.abort = () => {
          signal.aborted = true;
          listeners.forEach(listener => listener());
        };
      }: AbortController)
  : (null: any);

export type Cache = {|
  controller: AbortControllerLocal,
  data: Map<() => mixed, mixed>,
  refCount: number,
|};

export type CacheComponentState = {|
  +parent: Cache,
  +cache: Cache,
|};

export type SpawnedCachePool = {|
  +parent: Cache,
  +pool: Cache,
|};

// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
const {
  unstable_scheduleCallback: scheduleCallback,
  unstable_NormalPriority: NormalPriority,
} = Scheduler;

export const CacheContext: ReactContext<Cache> = enableCache
  ? {
      $$typeof: REACT_CONTEXT_TYPE,
      // We don't use Consumer/Provider for Cache components. So we'll cheat.
      Consumer: (null: any),
      Provider: (null: any),
      // We'll initialize these at the root.
      _currentValue: (null: any),
      _currentValue2: (null: any),
      _threadCount: 0,
      _defaultValue: (null: any),
      _globalName: (null: any),
    }
  : (null: any);

// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).
export function createCache(): Cache {
  if (!enableCache) {
    return (null: any);
  }
  const cache: Cache = {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0,
  };

  return cache;
}

export function retainCache(cache: Cache) {
  if (!enableCache) {
    return;
  }
  cache.refCount++;
}

// Cleanup a cache instance, potentially freeing it if there are no more references
export function releaseCache(cache: Cache) {
  if (!enableCache) {
    return;
  }
  cache.refCount--;
  if (cache.refCount === 0) {
    scheduleCallback(NormalPriority, () => {
      cache.controller.abort();
    });
  }
}

export function pushCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  pushProvider(workInProgress, CacheContext, cache);
}

export function popCacheProvider(workInProgress: Fiber, cache: Cache) {
  if (!enableCache) {
    return;
  }
  popProvider(CacheContext, workInProgress);
}
