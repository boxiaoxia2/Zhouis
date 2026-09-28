//#region src/shadow-utils/index-shadowless.js
function getClosestElement(element, selector) {
	return element.closest(selector);
}
function nodeContains(node, otherNode) {
	return node.contains(otherNode);
}
function createMutationObserver(callback) {
	return new MutationObserver(callback);
}
function createTreeWalker(doc, root, whatToShow, filter) {
	return doc.createTreeWalker(root, whatToShow, filter);
}
function getParentElement(node) {
	return node.parentElement;
}
//#endregion
export { createMutationObserver, createTreeWalker, getClosestElement, getParentElement, nodeContains };
