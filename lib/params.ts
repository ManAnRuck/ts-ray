/**
 * Module Dependencies
 */
import { isUrl, isHTML } from "./util";
import { Node } from "..";

/**
 * Export `params`
 */

export interface ParamsResult {
  source?: Selector | Cheerio | CheerioStatic | FinalFunction | null;
  context?: Selector | null;
  selector: Selector;
}

type FinalFunction = (err: Error, result: any) => any;

export type xRayFn = (
  source: Selector | Cheerio | CheerioStatic | FinalFunction,
  scope?: Selector | any,
  selector?: SelectorTypes | undefined
) => Node;

export interface SelectorObject {
  [name: string]: Selector;
}

export type SelectorArray = Selector[] | SelectorArray[];

export type SelectorTypes = SelectorObject | SelectorObject[] | SelectorArray[];

export type Selector =
  | SelectorObject
  | SelectorObject[]
  | Selector[]
  | Node
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
  context?: Selector,
  selector?: Selector
) => {
  const args: ParamsResult = {
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
