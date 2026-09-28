import { supportsFocusGroup } from "./utils.mjs";
import { FocusGroup } from "./focusgroup.mjs";
import { polyfill, polyfillBodyAndObserve } from "./polyfill.mjs";
//#region src/index.js
/**
* @typedef {import("./focusgroup-items.js").FocusGroupItemCollection} FocusGroupItemCollection
*/
/**
* @typedef {import("./focusgroup-items.js").FocusGroupItem} FocusGroupItem
*/
/**
* @typedef {import("./focusgroup-items.js").FocusGroupUpdateInfo} FocusGroupUpdateInfo
*/
//#endregion
export { FocusGroup, polyfill, polyfillBodyAndObserve, supportsFocusGroup };
