import { state } from "./global-state.mjs";
//#region src/observer-registry.js
/** @type {Set<MutationObserver>} */
var observers = state.o;
/**
* Flushes all globally registered focusgroup MutationObservers by calling
* `takeRecords()` on each, discarding any pending mutation records that were
* caused by polyfill-managed attribute writes. This prevents infinite
* cross-group loops between nested focusgroups whose subtrees overlap.
*/
function flushAllObservers() {
	for (const observer of observers) observer.takeRecords();
}
//#endregion
export { flushAllObservers, observers };
