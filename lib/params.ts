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

export function params(
  source: string | any[] | any,
  context?: string | any[] | any,
  selector?: string | any[] | any
) {
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
