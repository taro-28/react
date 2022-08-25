/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {Container, PublicInstance} from './ReactFiberHostConfig';
import type {Lane} from './ReactFiberLane.new';
import type {
  Fiber,
  FiberRoot,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';

import {get as getInstance} from 'shared/ReactInstanceMap';
import {
  getCurrentUpdatePriority,
  runWithPriority,
} from './ReactEventPriorities.new';
import {
  createUpdate,
  enqueueUpdate,
  entangleTransitions,
} from './ReactFiberClassUpdateQueue.new';
import {getPublicInstance} from './ReactFiberHostConfig';
import {createFiberRoot} from './ReactFiberRoot.new';
import {
  findCurrentHostFiber,
  findCurrentHostFiberWithNoPortals,
} from './ReactFiberTreeReflection';
import {
  batchedUpdates,
  deferredUpdates,
  discreteUpdates,
  flushControlled,
  flushPassiveEffects,
  flushSync,
  isAlreadyRendering,
  requestEventTime,
  requestUpdateLane,
  scheduleUpdateOnFiber,
} from './ReactFiberWorkLoop.new';
import {HostComponent} from './ReactWorkTags';
export {registerMutableSourceForHydration} from './ReactMutableSource.new';
export {createPortal} from './ReactPortal';
export {
  createComponentSelector,
  createHasPseudoClassSelector,
  createRoleSelector,
  createTestNameSelector,
  createTextSelector,
  findAllNodes,
  findBoundingRects,
  focusWithin,
  getFindAllNodesFailureDescription,
  observeVisibleRects,
} from './ReactTestSelectors';
export {
  batchedUpdates,
  deferredUpdates,
  discreteUpdates,
  flushControlled,
  flushSync,
  isAlreadyRendering,
  flushPassiveEffects,
};
export {getCurrentUpdatePriority, runWithPriority};
export {findHostInstance};
export {findHostInstanceWithWarning};

type OpaqueRoot = FiberRoot;

function findHostInstance(component: Object): PublicInstance | null {
  const fiber = getInstance(component);
  if (fiber === undefined) {
    if (typeof component.render === 'function') {
      throw new Error('Unable to find node on an unmounted component.');
    } else {
      const keys = Object.keys(component).join(',');
      throw new Error(
        `Argument appears to not be a ReactComponent. Keys: ${keys}`,
      );
    }
  }
  const hostFiber = findCurrentHostFiber(fiber);
  if (hostFiber === null) {
    return null;
  }
  return hostFiber.stateNode;
}

function findHostInstanceWithWarning(
  component: Object,
  methodName: string,
): PublicInstance | null {
  return findHostInstance(component);
}

export function createContainer(
  containerInfo: Container,
  concurrentUpdatesByDefaultOverride: null | boolean,
  transitionCallbacks: null | TransitionTracingCallbacks,
): OpaqueRoot {
  return createFiberRoot(
    containerInfo,
    concurrentUpdatesByDefaultOverride,
    transitionCallbacks,
  );
}

export function updateContainer(
  element: ReactNodeList,
  container: OpaqueRoot,
): Lane {
  const current = container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  const context = {};
  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(eventTime, lane);

  const root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane, eventTime);
    entangleTransitions(root, current, lane);
  }

  return lane;
}

export function getPublicRootInstance(
  container: OpaqueRoot,
): React$Component<any, any> | PublicInstance | null {
  const containerFiber = container.current;
  if (!containerFiber.child) {
    return null;
  }
  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);
    default:
      return containerFiber.child.stateNode;
  }
}

export function findHostInstanceWithNoPortals(
  fiber: Fiber,
): PublicInstance | null {
  const hostFiber = findCurrentHostFiberWithNoPortals(fiber);
  if (hostFiber === null) {
    return null;
  }
  return hostFiber.stateNode;
}

const shouldErrorImpl = fiber => null;

export function shouldError(fiber: Fiber): ?boolean {
  return shouldErrorImpl(fiber);
}

const shouldSuspendImpl = fiber => false;

export function shouldSuspend(fiber: Fiber): boolean {
  return shouldSuspendImpl(fiber);
}
