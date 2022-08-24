/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  FiberRoot,
  TransitionTracingCallbacks
} from 'react-reconciler/src/ReactInternalTypes';
import type { ReactNodeList } from 'shared/ReactTypes';


export type RootType = {
  render(children: ReactNodeList): void,
  unmount(): void,
  _internalRoot: FiberRoot | null,
  ...
};

export type CreateRootOptions = {
  unstable_concurrentUpdatesByDefault?: boolean,
  unstable_transitionCallbacks?: TransitionTracingCallbacks,
  ...
};


import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';
import {
  COMMENT_NODE, DOCUMENT_FRAGMENT_NODE, DOCUMENT_NODE, ELEMENT_NODE
} from '../shared/HTMLNodeType';
import {
  markContainerAsRoot,
  unmarkContainerAsRoot
} from './ReactDOMComponentTree';

import {
  createContainer, flushSync, updateContainer
} from 'react-reconciler/src/ReactFiberReconciler';
import { ConcurrentRoot } from 'react-reconciler/src/ReactRootTags';
import {
  allowConcurrentByDefault,
  disableCommentsAsDOMContainers
} from 'shared/ReactFeatureFlags';

/* global reportError */
const defaultOnRecoverableError =
  typeof reportError === 'function'
    ? // In modern browsers, reportError will dispatch an error event,
      // emulating an uncaught JavaScript error.
      reportError
    : (error: mixed) => {
        // In older browsers and test environments, fallback to console.error.
        // eslint-disable-next-line react-internal/no-production-logging
        console['error'](error);
      };

function ReactDOMRoot(internalRoot: FiberRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function(
  children: ReactNodeList,
): void {
  const root = this._internalRoot;
  if (root === null) {
    throw new Error('Cannot update an unmounted root.');
  }

  updateContainer(children, root);
};

ReactDOMRoot.prototype.unmount = function(): void {
  const root = this._internalRoot;
  if (root !== null) {
    this._internalRoot = null;
    const container = root.containerInfo;
    flushSync(() => {
      updateContainer(null, root);
    });
    unmarkContainerAsRoot(container);
  }
};

export function createRoot(
  container: Element | Document | DocumentFragment,
  options?: CreateRootOptions,
): RootType {
  if (!isValidContainer(container)) {
    throw new Error('createRoot(...): Target container is not a DOM element.');
  }

  let concurrentUpdatesByDefaultOverride = false;
  let transitionCallbacks = null;

  if (options !== null && options !== undefined) {
    if (
      allowConcurrentByDefault &&
      options.unstable_concurrentUpdatesByDefault === true
    ) {
      concurrentUpdatesByDefaultOverride = true;
    }
    if (options.unstable_transitionCallbacks !== undefined) {
      transitionCallbacks = options.unstable_transitionCallbacks;
    }
  }

  const root = createContainer(
    container,
    ConcurrentRoot,
    concurrentUpdatesByDefaultOverride,
    transitionCallbacks,
  );
  markContainerAsRoot(root.current, container);

  const rootContainerElement: Document | Element | DocumentFragment =
    container.nodeType === COMMENT_NODE
      ? (container.parentNode: any)
      : container;
  listenToAllSupportedEvents(rootContainerElement);

  return new ReactDOMRoot(root);
}



export function isValidContainer(node: any): boolean {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (!disableCommentsAsDOMContainers &&
        node.nodeType === COMMENT_NODE &&
        (node: any).nodeValue === ' react-mount-point-unstable '))
  );
}

// TODO: Remove this function which also includes comment nodes.
// We only use it in places that are currently more relaxed.
export function isValidContainerLegacy(node: any): boolean {
  return !!(
    node &&
    (node.nodeType === ELEMENT_NODE ||
      node.nodeType === DOCUMENT_NODE ||
      node.nodeType === DOCUMENT_FRAGMENT_NODE ||
      (node.nodeType === COMMENT_NODE &&
        (node: any).nodeValue === ' react-mount-point-unstable '))
  );
}