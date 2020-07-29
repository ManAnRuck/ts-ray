/**
 * Module Dependencies
 */
import Debug from "debug";
import { isArray } from "./util";
import { Selector } from "./params";
const parse = require("x-ray-parse");

const debug = Debug("resolve");

/**
 * Export `resolve`
 */

/**
 * Initialize `resolve`
 *
 * @param {$} cheerio object
 * @param {String} scope
 * @param {String|Array} selector
 * @param {Object} filters
 * @return {Array|String}
 */

export function resolve(
  $: CheerioStatic | Cheerio,
  scope: any,
  selector: string | string[],
  filters: Filters
) {
  // console.log("XXX", typeof selector, selector);
  debug("resolve($j, %j)", scope, selector);
  filters = filters || {};
  const array = isArray(selector);
  const obj = parse(array ? selector[0] : selector);
  obj.attribute = obj.attribute || "text";

  if (!obj.selector) {
    obj.selector = scope;
    scope = null;
  }

  let value: any = find(
    $,
    scope,
    array ? [obj.selector] : obj.selector,
    obj.attribute
  );
  debug("resolved($j, %j) => %j", scope, selector, value);

  if (array && typeof value.map === "function") {
    value = value.map((v: string) => {
      return filter(obj, $, scope, selector, v, filters);
    });
  } else {
    value = filter(obj, $, scope, selector, value, filters);
  }

  return value;
}

/**
 * Find the node(s)
 *
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String|Array} selector
 * @param {String} attr
 * @return {Array|String}
 */

function find(
  $: Cheerio | CheerioStatic,
  scope: any,
  selector: any,
  attr: any
) {
  if (scope && isArray(selector)) {
    var $scope = select($, scope);
    var out: any[] = [];
    $scope.map((i: number) => {
      const $el = $scope.eq(i);
      const $children = select($el, selector[0]);
      $children.map((i: number) => {
        out.push(attribute($children.eq(i), attr));
      });
    });
    return out;
  } else if (scope) {
    $scope = select($, scope);
    return attribute($scope.find(selector).eq(0), attr);
  } else {
    let $selector: Cheerio;
    if (isArray(selector)) {
      $selector = select($, selector[0]);
      out = [];
      $selector.map(function (i) {
        out.push(attribute($selector.eq(i), attr));
      });
      return out;
    } else {
      $selector = select($, selector);
      return attribute($selector.eq(0), attr);
    }
  }
}

/**
 * Selector abstraction, deals
 * with various instances of $
 *
 * @param {Cheerio} $
 * @param {String} selector
 * @return {Cheerio}
 */

function select($: Cheerio | CheerioStatic, selector: string) {
  if ("is" in $ && $.is(selector)) return $;
  return "find" in $ ? $.find(selector) : $(selector);
}

/**
 * Select the attribute based on `attr`
 *
 * @param {Cheerio} $
 * @param {String} attr
 * @return {String}
 */

function attribute($el: Cheerio, attr: string) {
  switch (attr) {
    case "html":
      return $el.html();
    case "text":
      return $el.text();
    default:
      return $el.attr(attr);
  }
}

export interface Filters {
  [name: string]: (...args: string[]) => string;
}

export interface Filter {
  name: string;
  args: string[];
}

export interface FilterObject {
  selector: string;
  attribute: string;
  filters: Filter[];
}

/**
 * Filter the value(s)
 *
 * @param {Object} obj
 * @param {Cheerio} $
 * @param {String} scope
 * @param {String|Array} selector
 * @param {Object} filters
 * @return {Array|String}
 */
function filter(
  obj: FilterObject,
  $: Cheerio | CheerioStatic,
  _scope: string | boolean | null,
  _selector: Selector,
  value: string,
  filters: Filters
) {
  const ctx = { $: $, selector: obj.selector, attribute: obj.attribute };
  return (obj.filters || []).reduce((out, filter) => {
    const fn = filters[filter.name];
    if (typeof fn === "function") {
      const args = [out].concat(filter.args || []);
      const filtered = fn.apply(ctx, args);
      debug("%s.apply(ctx, %j) => %j", filter.name, args, filtered);
      return filtered;
    } else {
      throw new Error("Invalid filter: " + filter.name);
    }
  }, value);
}
