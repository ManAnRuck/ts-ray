/**
 * Module Dependencies
 */
import { isUrl, isHTML } from "./util";

/**
 * Export `params`
 */

/**
 * Sort out the parameters
 *
 * @param {String|Array|Object} source
 * @param {String|Array|Object} context
 * @param {String|Array|Object} selector
 * @return {Object}
 */

export interface ParamsResult {
  source?: any;
  context?: any;
  selector: any;
}

export type xRayFn = (
  source: any,
  scope?: any,
  selector?: SelectorObject | SelectorObject[] | undefined
) => any;

export interface SelectorObject {
  [name: string]: Selector;
}

export type Selector =
  | SelectorObject
  | SelectorObject[]
  | Selector[]
  | string
  | string[]
  | xRayFn;

export function params(
  source: any,
  context?: string | Selector,
  selector?: Selector
) {
  // if (source !== undefined) console.log("TsourceT", typeof source, source);
  var args: ParamsResult = {
    selector: source,
  };
  if (undefined === context) {
    args.source = null;
    args.context = null;
    args.selector = source;
  } else if (undefined === selector) {
    if (isUrl(source) || source.html || isHTML(source)) {
      args.source = source;
      args.context = null;
    } else {
      args.source = null;
      args.context = source;
    }
    args.selector = context;
  } else {
    args.source = source;
    args.context = context;
    args.selector = selector;
  }

  return args;
}
