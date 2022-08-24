/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type { ReactNodeList } from 'shared/ReactTypes';
import type { Container } from './ReactDOMHostConfig';
import type {
  CreateRootOptions, RootType
} from './ReactDOMRoot';

import { createEventHandle } from './ReactDOMEventHandle';
import {
  findDOMNode, render, unmountComponentAtNode, unstable_renderSubtreeIntoContainer
} from './ReactDOMLegacy';
import {
  createRoot as createRootImpl, isValidContainer
} from './ReactDOMRoot';

import {
  getCurrentUpdatePriority, runWithPriority
} from 'react-reconciler/src/ReactEventPriorities';
import {
  batchedUpdates,
  discreteUpdates, flushControlled, flushSync as flushSyncWithoutWarningIfAlreadyRendering
} from 'react-reconciler/src/ReactFiberReconciler';
import { createPortal as createPortalImpl } from 'react-reconciler/src/ReactPortal';
import { enableNewReconciler } from 'shared/ReactFeatureFlags';
import ReactVersion from 'shared/ReactVersion';

import {
  enqueueStateRestore,
  restoreStateIfNeeded, setRestoreImplementation
} from '../events/ReactDOMControlledComponent';
import { setGetCurrentUpdatePriority } from '../events/ReactDOMEventReplaying';
import { setBatchingImplementation } from '../events/ReactDOMUpdateBatching';
import { restoreControlledState } from './ReactDOMComponent';
import {
  getFiberCurrentPropsFromNode, getInstanceFromNode,
  getNodeFromInstance
} from './ReactDOMComponentTree';

setGetCurrentUpdatePriority(getCurrentUpdatePriority);


setRestoreImplementation(restoreControlledState);
setBatchingImplementation(
  batchedUpdates,
  discreteUpdates,
  flushSyncWithoutWarningIfAlreadyRendering,
);

function createPortal(
  children: ReactNodeList,
  container: Element | DocumentFragment,
  key: ?string = null,
): React$Portal {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  // TODO: pass ReactDOM portal implementation as third argument
  // $FlowFixMe The Flow type is opaque but there's no way to actually create it.
  return createPortalImpl(children, container, null, key);
}

function renderSubtreeIntoContainer(
  parentComponent: React$Component<any, any>,
  element: React$Element<any>,
  containerNode: Container,
  callback: ?Function,
) {
  return unstable_renderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    callback,
  );
}

const Internals = {
  usingClientEntryPoint: false,
  // Keep in sync with ReactTestUtils.js.
  // This is an array for better minification.
  Events: [
    getInstanceFromNode,
    getNodeFromInstance,
    getFiberCurrentPropsFromNode,
    enqueueStateRestore,
    restoreStateIfNeeded,
    batchedUpdates,
  ],
};

function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  return createRootImpl(container, options);
}


// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
declare function flushSync<R>(fn: () => R): R;
// eslint-disable-next-line no-redeclare
declare function flushSync(): void;
// eslint-disable-next-line no-redeclare
function flushSync(fn) {
  return flushSyncWithoutWarningIfAlreadyRendering(fn);
}

export {
  createPortal,
  batchedUpdates as unstable_batchedUpdates,
  flushSync,
  Internals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ReactVersion as version,
  // Disabled behind disableLegacyReactDOMAPIs
  findDOMNode,
  render,
  unmountComponentAtNode,
  // exposeConcurrentModeAPIs
  createRoot,
  flushControlled as unstable_flushControlled,
  // Disabled behind disableUnstableRenderSubtreeIntoContainer
  renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer,
  // enableCreateEventHandleAPI
  createEventHandle as unstable_createEventHandle,
  // TODO: Remove this once callers migrate to alternatives.
  // This should only be used by React internals.
  runWithPriority as unstable_runWithPriority,
};



export const unstable_isNewReconciler = enableNewReconciler;
