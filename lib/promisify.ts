/**
 * Module Dependencies
 */

var sts = require("stream-to-string");

/**
 * Convert a readStream from xray.stream() into
 * a Promise resolved with written string
 *
 * @param {Stream} strem
 * @return {Promise}
 */
export const streamToPromise = (stream: any) => {
  return new Promise(function (resolve, reject) {
    sts(stream, (err: any, resStr: string) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(resStr));
        } catch (e) {
          reject(e);
        }
      }
    });
  });
};