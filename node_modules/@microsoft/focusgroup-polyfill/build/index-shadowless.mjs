import { supportsFocusGroup } from "./utils-shadowless.mjs";
import { FocusGroup } from "./focusgroup-shadowless.mjs";
import { polyfill, polyfillBodyAndObserve } from "./polyfill-shadowless.mjs";
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
