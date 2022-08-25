/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FiberRoot, TransitionTracingCallbacks} from './ReactInternalTypes';

import {enableCache, enableTransitionTracing} from 'shared/ReactFeatureFlags';
import {createHostRootFiber} from './ReactFiber.new';
import {initializeUpdateQueue} from './ReactFiberClassUpdateQueue.new';
import {noTimeout} from './ReactFiberHostConfig';
import {
  createLaneMap,
  NoLane,
  NoLanes,
  NoTimestamp,
  TotalLanes,
} from './ReactFiberLane.new';
import {ConcurrentMode} from './ReactTypeOfMode';

export type RootState = {
  element: any,
};

function FiberRootNode(
  containerInfo,
  tag,
  identifierPrefix,
  onRecoverableError,
) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.pendingChildren = null;
  this.current = null;
  this.pingCache = null;
  this.finishedWork = null;
  this.timeoutHandle = noTimeout;
  this.context = null;
  this.pendingContext = null;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  this.eventTimes = createLaneMap(NoLanes);
  this.expirationTimes = createLaneMap(NoTimestamp);

  this.pendingLanes = NoLanes;
  this.suspendedLanes = NoLanes;
  this.pingedLanes = NoLanes;
  this.expiredLanes = NoLanes;
  this.mutableReadLanes = NoLanes;
  this.finishedLanes = NoLanes;

  this.entangledLanes = NoLanes;
  this.entanglements = createLaneMap(NoLanes);

  this.hiddenUpdates = createLaneMap(null);

  if (enableCache) {
    this.pooledCache = null;
    this.pooledCacheLanes = NoLanes;
  }

  this.incompleteTransitions = new Map();
  if (enableTransitionTracing) {
    this.transitionCallbacks = null;
    const transitionLanesMap = (this.transitionLanes = []);
    for (let i = 0; i < TotalLanes; i++) {
      transitionLanesMap.push(null);
    }
  }
}

export function createFiberRoot(
  containerInfo: any,
  concurrentUpdatesByDefaultOverride: null | boolean,
  // TODO: We have several of these arguments that are conceptually part of the
  // host config, but because they are passed in at runtime, we have to thread
  // them through the root constructor. Perhaps we should put them all into a
  // single type, like a DynamicHostConfig that is defined by the renderer.
  transitionCallbacks: null | TransitionTracingCallbacks,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(
    containerInfo,
    ConcurrentMode,
  ): any);
  if (enableTransitionTracing) {
    root.transitionCallbacks = transitionCallbacks;
  }

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  const uninitializedFiber = createHostRootFiber(
    concurrentUpdatesByDefaultOverride,
  );
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  uninitializedFiber.memoizedState = {element: null};

  initializeUpdateQueue(uninitializedFiber);

  return root;
}
