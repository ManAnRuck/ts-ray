/**
 * Module Dependencies
 */
import { isObject } from "./util";
import Batch from "batch";

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

export function walk(value: string | any, fn: any, done: any, key?: string) {
  var batch = Batch();
  var out: any;

  if (isObject(value)) {
    out = {};
    Object.keys(value).forEach(function (k) {
      var v = value[k];
      batch.push((next: any) => {
        walk(
          v,
          fn,
          (err: Error, value: string) => {
            if (err) return next(err);
            // ignore undefined values
            if (undefined !== value && value !== "") {
              out[k] = value;
            }
            next();
          },
          k
        );
      });
    });
  } else {
    out = null;
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
