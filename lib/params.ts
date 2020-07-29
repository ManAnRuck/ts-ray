/**
 * Module Dependencies
 */
import { isUrl, isHTML } from "./util";

/**
 * Export `params`
 */

export interface ParamsResult {
  source?: any;
  context?: any;
  selector: Selector;
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

/**
 * Sort out the parameters
 *
 * @param {String|Array|Object} source
 * @param {String|Array|Object} context
 * @param {String|Array|Object} selector
 * @return {Object}
 */
export const params = (
  source: any,
  context?: string | Selector,
  selector?: Selector
) => {
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
};
