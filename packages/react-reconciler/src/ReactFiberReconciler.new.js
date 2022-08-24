/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ReactNodeList } from 'shared/ReactTypes';
import type {
  Container, PublicInstance
} from './ReactFiberHostConfig';
import type { Lane } from './ReactFiberLane.new';
import type { SuspenseState } from './ReactFiberSuspenseComponent.new';
import type {
  Fiber, FiberRoot, TransitionTracingCallbacks
} from './ReactInternalTypes';
import type { RootTag } from './ReactRootTags';

import { get as getInstance } from 'shared/ReactInstanceMap';
import {
  getCurrentUpdatePriority,
  runWithPriority
} from './ReactEventPriorities.new';
import {
  createUpdate,
  enqueueUpdate,
  entangleTransitions
} from './ReactFiberClassUpdateQueue.new';
import {
  emptyContextObject, findCurrentUnmaskedContext, isContextProvider as isLegacyContextProvider, processChildContext
} from './ReactFiberContext.new';
import { getPublicInstance } from './ReactFiberHostConfig';
import {
  higherPriorityLane
} from './ReactFiberLane.new';
import { createFiberRoot } from './ReactFiberRoot.new';
import {
  findCurrentHostFiber,
  findCurrentHostFiberWithNoPortals
} from './ReactFiberTreeReflection';
import {
  batchedUpdates, deferredUpdates,
  discreteUpdates, flushControlled, flushPassiveEffects, flushSync,
  isAlreadyRendering, requestEventTime,
  requestUpdateLane, scheduleUpdateOnFiber
} from './ReactFiberWorkLoop.new';
import {
  ClassComponent, HostComponent
} from './ReactWorkTags';
export { registerMutableSourceForHydration } from './ReactMutableSource.new';
export { createPortal } from './ReactPortal';
export {
  createComponentSelector,
  createHasPseudoClassSelector,
  createRoleSelector,
  createTestNameSelector,
  createTextSelector, findAllNodes,
  findBoundingRects,
  focusWithin, getFindAllNodesFailureDescription, observeVisibleRects
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
export { getCurrentUpdatePriority, runWithPriority };
export { findHostInstance };
export { findHostInstanceWithWarning };

type OpaqueRoot = FiberRoot;


function getContextForSubtree(
  parentComponent: ?React$Component<any, any>,
): Object {
  if (!parentComponent) {
    return emptyContextObject;
  }

  const fiber = getInstance(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;
    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
}

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
  tag: RootTag,
  concurrentUpdatesByDefaultOverride: null | boolean,
  transitionCallbacks: null | TransitionTracingCallbacks,
): OpaqueRoot {
  return createFiberRoot(
    containerInfo,
    tag,
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


function markRetryLaneImpl(fiber: Fiber, retryLane: Lane) {
  const suspenseState: null | SuspenseState = fiber.memoizedState;
  if (suspenseState !== null && suspenseState.dehydrated !== null) {
    suspenseState.retryLane = higherPriorityLane(
      suspenseState.retryLane,
      retryLane,
    );
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

let shouldErrorImpl = fiber => null;

export function shouldError(fiber: Fiber): ?boolean {
  return shouldErrorImpl(fiber);
}

let shouldSuspendImpl = fiber => false;

export function shouldSuspend(fiber: Fiber): boolean {
  return shouldSuspendImpl(fiber);
}
