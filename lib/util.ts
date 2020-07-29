import objectAssign from "object-assign";
import isObject from "isobject";
import isUrl from "is-url";

const has = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;

/**
 * Get the root, if there is one.
 *
 * @param {Mixed}
 * @return {Boolean|String}
 */
const root = (selector: string | string[]) => {
  return (
    (typeof selector === "string" || isArray(selector)) &&
    !~selector.indexOf("@") &&
    typeof selector === "string" &&
    !isUrl(selector) &&
    selector
  );
};

/**
 * Compact an array,
 * removing empty objects
 *
 * @param {Array} arr
 * @return {Array}
 */
const compact = (arr: string[][]) => {
  return arr.filter(function (val) {
    if (!val) return false;
    if (val.length !== undefined) return val.length !== 0;
    for (var key in val) if (has.call(val, key)) return true;
    return false;
  });
};

/**
 * Check if the string is HTML
 */
const isHTML = (str: string) => {
  str = (str || "").toString().trim();
  return str[0] === "<" && str[str.length - 1] === ">";
};

export { root, isUrl, isArray, isHTML, compact, isObject, objectAssign };
