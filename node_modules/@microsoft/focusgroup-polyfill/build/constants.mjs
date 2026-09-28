//#region src/constants.js
/** @enum {string} */
var DatasetName = {
	INFERRED_ROLE: "data-fg-ir",
	ITEM: "data-fg-item",
	AUTHOR_TABINDEX: "data-fg-ati",
	SEGMENT: "data-fg-seg",
	SEGMENT_START: "data-fg-segs"
};
/** @enum {string} */
var BehaviorToken = {
	TOOLBAR: "toolbar",
	TABLIST: "tablist",
	RADIOGROUP: "radiogroup",
	LISTBOX: "listbox",
	MENU: "menu",
	MENUBAR: "menubar",
	NONE: "none"
};
var BEHAVIOR_TOKENS = [
	BehaviorToken.TOOLBAR,
	BehaviorToken.TABLIST,
	BehaviorToken.RADIOGROUP,
	BehaviorToken.LISTBOX,
	BehaviorToken.MENU,
	BehaviorToken.MENUBAR,
	BehaviorToken.NONE
];
/**
* @typedef {Object} Behavior
* @property {string} ownerRole
* @property {(string|null)} childRole
* @property {boolean} wrap
* @property {("inline"|"block"|undefined)} axis
*/
/** @type {Record<BehaviorToken, Behavior>} */
var BehaviorMap = {
	toolbar: {
		ownerRole: "toolbar",
		childRole: null,
		wrap: false,
		axis: "inline"
	},
	tablist: {
		ownerRole: "tablist",
		childRole: "tab",
		wrap: true,
		axis: "inline"
	},
	radiogroup: {
		ownerRole: "radiogroup",
		childRole: "radio",
		wrap: true,
		axis: void 0
	},
	listbox: {
		ownerRole: "listbox",
		childRole: "option",
		wrap: false,
		axis: "block"
	},
	menu: {
		ownerRole: "menu",
		childRole: "menuitem",
		wrap: true,
		axis: "block"
	},
	menubar: {
		ownerRole: "menubar",
		childRole: "menuitem",
		wrap: true,
		axis: "inline"
	}
};
//#endregion
export { BEHAVIOR_TOKENS, BehaviorMap, BehaviorToken, DatasetName };
