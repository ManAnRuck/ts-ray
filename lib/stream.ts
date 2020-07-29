import { isArray } from "./util";

/**
 * Streaming array helper
 *
 * @param {Stream} data (optional)
 * @return {Function}
 */
export const array = (stream: any) => {
  if (!stream) return function () {};
  var first = true;

  return function _stream_array(data: any, end: any) {
    var string = JSON.stringify(data, null, 2);
    var json = isArray(data) ? string.slice(1, -1) : string;
    var empty = json.trim() === "";

    if (first && empty && !end) return;
    if (first) {
      stream.write("[\n");
    }
    if (!first && !empty) {
      stream.write(",");
    }

    if (end) {
      stream.end(json + "]");
    } else {
      stream.write(json);
    }

    first = false;
  };
};

/**
 * Streaming object helper
 *
 * @param {Stream} data (optional)
 * @return {Function}
 */
export const object = (stream: any) => {
  if (!stream) return function () {};

  return (data: any, end: any) => {
    var json = JSON.stringify(data, null, 2);

    if (end) {
      stream.end(json);
    } else {
      stream.write(json);
    }
  };
};

export const waitCb = (stream: any, fn: any) => {
  fn((err: Error) => {
    if (err) stream.emit("error", err);
  });
};

export default { waitCb, object, array };
