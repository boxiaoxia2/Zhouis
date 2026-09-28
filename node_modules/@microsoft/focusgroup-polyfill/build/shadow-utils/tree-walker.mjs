import { getLastElementDescendant, nodeContains } from "./dom.mjs";
//#region src/shadow-utils/tree-walker.js
/** @see https://github.com/microsoft/tabster/tree/master/src/Shadowdomize */
var ShadowTreeWalker = class {
	filter;
	root;
	whatToShow;
	get currentNode() {
		return this.#currentNode;
	}
	set currentNode(node) {
		if (!nodeContains(this.root, node)) throw new Error("Cannot set currentNode to a node that is not contained by the root node.");
		this.#currentNode = node;
		this.#forwardStack = null;
		this.#backwardStack = null;
		this.#resetSlotted();
		this.#isLastDirectionForward = false;
	}
	/** @type {Document} */
	#doc;
	/** @type {Node} */
	#currentNode;
	/** @type {Array<{walker: TreeWalker, hostNode: Element|null}> | null} */
	#forwardStack = null;
	/** @type {Array<{walker: TreeWalker, hostNode: Element|null}> | null} */
	#backwardStack = null;
	/** @type {Element[]} */
	#slotted = [];
	/**
	* Tracks slotted elements whose children have been queued
	* @type {WeakSet<Element>}
	*/
	#slottedWithChildren = /* @__PURE__ */ new WeakSet();
	/** @type {boolean} */
	#isLastDirectionForward = true;
	constructor(doc, root, whatToShow, filter) {
		this.#doc = doc;
		this.root = root;
		this.filter = filter ?? null;
		this.whatToShow = whatToShow ?? NodeFilter.SHOW_ALL;
		this.#currentNode = root;
	}
	nextNode() {
		if (!this.#isLastDirectionForward) {
			this.#forwardStack = null;
			this.#resetSlotted();
			this.#isLastDirectionForward = true;
		}
		if (this.#forwardStack === null) this.#forwardStack = this.#buildStack(true);
		const previous = this.#currentNode;
		const result = this.#walkForward();
		if (result === null) {
			this.#currentNode = previous;
			this.#forwardStack = null;
			this.#resetSlotted();
		}
		return result;
	}
	previousNode() {
		if (this.#isLastDirectionForward) {
			this.#backwardStack = null;
			this.#resetSlotted();
			this.#isLastDirectionForward = false;
		}
		if (this.#backwardStack === null) this.#backwardStack = this.#buildStack(false);
		const previous = this.#currentNode;
		const result = this.#walkBackward();
		if (result === null) {
			this.#currentNode = previous;
			this.#backwardStack = null;
			this.#resetSlotted();
		}
		return result;
	}
	#resetSlotted() {
		this.#slotted = [];
		this.#slottedWithChildren = /* @__PURE__ */ new WeakSet();
	}
	#filterNode = (node) => {
		if (typeof this.filter === "function") return this.filter(node);
		else if (this.filter?.acceptNode) return this.filter.acceptNode(node);
		return NodeFilter.FILTER_ACCEPT;
	};
	/**
	* Creates a native TreeWalker scoped to the given root, using the
	* direction-specific filter produced by `#makeFilter`.
	* @param {Node} root
	* @param {boolean} isForward
	* @returns {TreeWalker}
	*/
	#createWalker(root, isForward) {
		return this.#doc.createTreeWalker(root, this.whatToShow, { acceptNode: this.#makeFilter(isForward) });
	}
	/**
	* Returns a filter callback for native TreeWalker nodes.
	*
	* Both directions accept shadow hosts and apply `#filterNode` to regular
	* elements. The only difference is a side effect: forward filters push a
	* new shadow walker onto `#forwardStack` when a shadow host is encountered
	* (the backward path handles shadow entry explicitly in `#walkBackward`).
	*
	* @param {boolean} isForward
	*/
	#makeFilter(isForward) {
		return (node) => {
			if (node.nodeType === Node.ELEMENT_NODE) {
				if (node.parentNode?.shadowRoot) return NodeFilter.FILTER_REJECT;
				if (node.localName === "slot" && node.getRootNode() instanceof ShadowRoot) return NodeFilter.FILTER_ACCEPT;
				const shadowRoot = node.shadowRoot;
				if (shadowRoot) {
					if (isForward) {
						const top = this.#forwardStack[0];
						if (!top || top.walker.root !== shadowRoot) {
							const walker = this.#createWalker(shadowRoot, true);
							this.#forwardStack.unshift({
								walker,
								hostNode: node
							});
						}
					}
					return NodeFilter.FILTER_ACCEPT;
				} else return this.#filterNode(node);
			}
			return NodeFilter.FILTER_SKIP;
		};
	}
	/**
	* Builds a direction-specific stack from `#currentNode` by walking up
	* through shadow roots to the walker's `root`.
	*
	* The stack is ordered innermost-first: index 0 is the walker whose root
	* contains `#currentNode` directly.
	*
	* @param {boolean} isForward
	* @returns {Array<{walker: TreeWalker, hostNode: Element|null}>}
	*/
	#buildStack(isForward) {
		if (!nodeContains(this.root, this.#currentNode)) this.#currentNode = this.root;
		const stack = [];
		let currentNode = this.#currentNode;
		let walkerCurrentNode = this.#currentNode;
		const resolveSlot = (node) => {
			const slot = node.assignedSlot;
			if (!slot || !nodeContains(this.root, slot)) return [];
			const assigned = [...slot.assignedElements({ flatten: true })];
			const idx = assigned.indexOf(node);
			let siblings = [];
			if (isForward) {
				if (idx >= 0 && idx < assigned.length - 1) siblings = assigned.slice(idx + 1);
			} else if (idx > 0) siblings = assigned.slice(0, idx).reverse();
			currentNode = walkerCurrentNode = slot;
			return siblings;
		};
		const initialSlotted = resolveSlot(this.#currentNode);
		this.#slotted = initialSlotted;
		while (currentNode && currentNode !== this.root) if (currentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
			const shadowRoot = currentNode;
			const walker = this.#createWalker(shadowRoot, isForward);
			walker.currentNode = walkerCurrentNode;
			stack.push({
				walker,
				hostNode: shadowRoot.host
			});
			currentNode = walkerCurrentNode = shadowRoot.host;
			const siblings = resolveSlot(currentNode);
			if (siblings.length) stack[stack.length - 1].savedSlotted = siblings;
		} else currentNode = currentNode.parentNode;
		const rootWalker = this.#createWalker(this.root, isForward);
		rootWalker.currentNode = walkerCurrentNode;
		stack.push({
			walker: rootWalker,
			hostNode: null
		});
		const rootShadow = this.root.shadowRoot;
		if (rootShadow && !stack.some((e) => e.walker.root === rootShadow)) {
			const shadowWalker = this.#createWalker(rootShadow, isForward);
			stack.unshift({
				walker: shadowWalker,
				hostNode: this.root
			});
		}
		if (isForward && this.#currentNode !== this.root) {
			const currentShadow = this.#currentNode.shadowRoot;
			if (currentShadow && !stack.some((e) => e.walker.root === currentShadow)) {
				const entry = {
					walker: this.#createWalker(currentShadow, isForward),
					hostNode: this.#currentNode
				};
				if (initialSlotted.length) {
					entry.savedSlotted = initialSlotted;
					this.#slotted = [];
				}
				stack.unshift(entry);
			}
		}
		return stack;
	}
	/**
	* Forward traversal engine. Operates on `#forwardStack`.
	* Functionally identical to the old `nextNode()` body.
	*/
	#walkForward() {
		while (true) {
			if (this.#slotted.length > 0) {
				const slottedEl = this.#slotted.shift();
				if (slottedEl.shadowRoot) {
					const nodeResult = this.#filterNode(slottedEl);
					if (nodeResult === NodeFilter.FILTER_REJECT) continue;
					const shadowRoot = slottedEl.shadowRoot;
					const walker = this.#createWalker(shadowRoot, true);
					const savedSlotted = this.#slotted;
					this.#slotted = [];
					this.#forwardStack.unshift({
						walker,
						hostNode: slottedEl,
						savedSlotted
					});
					if (nodeResult === NodeFilter.FILTER_ACCEPT) {
						this.#currentNode = slottedEl;
						return slottedEl;
					}
					continue;
				}
				const nodeResult = this.#filterNode(slottedEl);
				if (nodeResult !== NodeFilter.FILTER_REJECT) {
					if (slottedEl.firstElementChild) this.#slotted.unshift(...slottedEl.children);
				}
				if (nodeResult === NodeFilter.FILTER_ACCEPT) {
					this.#currentNode = slottedEl;
					return slottedEl;
				}
				continue;
			}
			const active = this.#forwardStack[0];
			if (!active) return null;
			const nextNode = active.walker.nextNode();
			if (nextNode) {
				if (nextNode.localName === "slot") {
					this.#slotted = [...nextNode.assignedElements({ flatten: true })];
					continue;
				}
				if (nextNode.shadowRoot) {
					if (this.#filterNode(nextNode) === NodeFilter.FILTER_ACCEPT) {
						this.#currentNode = nextNode;
						return nextNode;
					}
					continue;
				}
				this.#currentNode = nextNode;
				return nextNode;
			} else if (this.#forwardStack.length > 1) {
				const popped = this.#forwardStack.shift();
				if (popped.savedSlotted?.length) this.#slotted = popped.savedSlotted;
			} else return null;
		}
	}
	/**
	* Backward traversal engine. Operates on `#backwardStack`.
	*
	* Unlike `#walkForward()`, this does NOT rely on filter side effects to
	* push shadow walkers. Instead, when a shadow host is encountered via
	* native `previousNode()`, it explicitly creates and pushes a shadow walker
	* positioned at the last descendant of the shadow root, then recurses.
	*
	* When a shadow walker is exhausted, the host is returned (if accepted by
	* the user filter), because in reverse tree order shadow children come
	* before the host.
	*/
	#walkBackward() {
		while (true) {
			if (this.#slotted.length > 0) {
				const slottedEl = this.#slotted.shift();
				if (slottedEl.shadowRoot) {
					if (this.#filterNode(slottedEl) === NodeFilter.FILTER_REJECT) continue;
					this.#currentNode = slottedEl;
					const savedSlotted = this.#slotted;
					this.#slotted = [];
					this.#backwardStack.unshift({
						walker: this.#createWalker(slottedEl.shadowRoot, false),
						hostNode: slottedEl,
						savedSlotted
					});
					continue;
				}
				const nodeResult = this.#filterNode(slottedEl);
				if (nodeResult === NodeFilter.FILTER_REJECT) continue;
				if (slottedEl.firstElementChild && !this.#slottedWithChildren.has(slottedEl)) {
					this.#slottedWithChildren.add(slottedEl);
					this.#slotted.unshift(...[...slottedEl.children].reverse(), slottedEl);
					continue;
				}
				if (nodeResult === NodeFilter.FILTER_ACCEPT) {
					this.#currentNode = slottedEl;
					return slottedEl;
				}
				continue;
			}
			const active = this.#backwardStack[0];
			if (!active) return null;
			if (active.walker.currentNode === active.walker.root && active.walker.root !== this.root) {
				const lastChild = getLastElementDescendant(active.walker.root);
				if (lastChild) {
					active.walker.currentNode = lastChild;
					if (lastChild.localName === "slot") {
						this.#slotted = [...lastChild.assignedElements({ flatten: true })].reverse();
						continue;
					}
					if (lastChild.shadowRoot) {
						this.#currentNode = lastChild;
						this.#backwardStack.unshift({
							walker: this.#createWalker(lastChild.shadowRoot, false),
							hostNode: lastChild
						});
						continue;
					}
					if (this.#filterNode(lastChild) === NodeFilter.FILTER_ACCEPT) {
						this.#currentNode = lastChild;
						return lastChild;
					}
				}
			}
			const previousNode = active.walker.previousNode();
			if (previousNode) {
				if (previousNode.localName === "slot") {
					this.#slotted = [...previousNode.assignedElements({ flatten: true })].reverse();
					continue;
				}
				if (previousNode.shadowRoot) {
					this.#currentNode = previousNode;
					this.#backwardStack.unshift({
						walker: this.#createWalker(previousNode.shadowRoot, false),
						hostNode: previousNode
					});
					continue;
				}
				if (this.#filterNode(previousNode) === NodeFilter.FILTER_ACCEPT) {
					this.#currentNode = previousNode;
					return previousNode;
				}
				this.#currentNode = previousNode;
				return previousNode;
			} else if (this.#backwardStack.length > 1) {
				const popped = this.#backwardStack.shift();
				if (popped.savedSlotted?.length) this.#slotted = popped.savedSlotted;
				const hostNode = popped.hostNode;
				if (hostNode) {
					if (this.#filterNode(hostNode) === NodeFilter.FILTER_ACCEPT) {
						this.#currentNode = hostNode;
						return hostNode;
					}
				}
			} else {
				if (this.#currentNode !== this.root) {
					if (this.#filterNode(this.root) === NodeFilter.FILTER_ACCEPT) {
						this.#currentNode = this.root;
						return this.root;
					}
				}
				return null;
			}
		}
	}
};
function createTreeWalker(doc, root, whatToShow, filter) {
	return new ShadowTreeWalker(doc, root, whatToShow, filter);
}
//#endregion
export { createTreeWalker };
