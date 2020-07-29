/**
 * Module Dependencies
 */
import { isObject } from "./util";
import Batch from "batch";
import { Selector } from "./params";

/**
 * Walk
 */

/**
 * Walk recursively, providing
 * callbacks for each step.
 *
 * @param {Mixed} value
 * @param {Function} fn
 * @param {Function} done
 * @param {String} key (private)
 */

export function walk(
  value: Selector,
  fn: (value: Selector, key?: string, next?: any) => any,
  done: (err: Error | null, value?: string | object) => any,
  key?: string
) {
  var batch = Batch();
  var out: string | object;

  if (isObject(value)) {
    out = {};
    Object.keys(value).forEach(function (k) {
      var v = (value as any)[k];
      batch.push((next: any) => {
        walk(
          v,
          fn,
          (err, value) => {
            if (err) return next(err);
            // ignore undefined values
            if (undefined !== value && value !== "") {
              (out as any)[k] = value;
            }
            next();
          },
          k
        );
      });
    });
  } else {
    batch.push((next: any) => {
      fn(value, key, (err: Error, v: string) => {
        if (err) return next(err);
        out = v;
        next();
      });
    });
  }

  batch.end((err: Error) => {
    if (err) return done(err);
    return done(null, out);
  });
}
