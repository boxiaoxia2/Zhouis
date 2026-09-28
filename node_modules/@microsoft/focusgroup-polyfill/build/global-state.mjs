//#region src/global-state.js
/**
* @type {{ o: Set<MutationObserver>, m?: Map<HTMLElement, *>, g?: MutationObserver, b: boolean }}
* @global
*/
globalThis.__FOCUSGROUP_POLYFILL__ ??= {
	o: /* @__PURE__ */ new Set(),
	b: false
};
var state = globalThis.__FOCUSGROUP_POLYFILL__;
//#endregion
export { state };
