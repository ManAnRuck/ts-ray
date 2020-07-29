/**
 * Module Dependencies
 */

import sts from "stream-to-string";

/**
 * Convert a readStream from xray.stream() into
 * a Promise resolved with written string
 *
 * @param {Stream} strem
 * @return {Promise}
 */
export const streamToPromise = (stream: NodeJS.ReadableStream) => {
  return sts(stream).then(JSON.parse);
};
