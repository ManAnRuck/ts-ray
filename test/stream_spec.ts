/* global it describe */

/**
 * Module Dependencies
 */

import assert from "assert";
import { EventEmitter } from "events";
import streamHelper from "../lib/stream";

function createStream() {
  var instance: any = new EventEmitter();
  instance._data = "";
  instance._open = true;
  instance.on("write", function (chunk: any) {
    instance._data += chunk;
  });
  instance.once("end", function () {
    instance._open = false;
  });

  instance.write = function write(chunk: any) {
    instance.emit("write", String(chunk) || "");
  };
  instance.error = function error(err: Error) {
    instance.emit("error", err);
  };
  instance.end = function end(chunk: any) {
    if (!instance._open) return;
    instance.emit("write", chunk);
    instance.emit("end");
  };

  return instance;
}

function getSessionResult(...args: any[]) {
  var events = Array.prototype.slice.call(args);
  var stream = createStream();
  var helper = streamHelper.array(stream);
  events.forEach(function (data, index) {
    helper(data, index === events.length - 1);
  });
  while (stream._open) {
    /* wait for stream to close */
  }
  return JSON.stringify(JSON.parse(stream._data));
}

/**
 * Tests
 */

describe("stream.array helper", function () {
  it("accepts non-empty arrays", function () {
    var result = getSessionResult([1, 2], [3]);
    assert.equal(result, "[1,2,3]");
  });
  it("accepts one non-empty array", function () {
    var result = getSessionResult([1]);
    assert.equal(result, "[1]");
  });
  it("accepts one empty array", function () {
    var result = getSessionResult([]);
    assert.equal(result, "[]");
  });
  it("accepts one single value", function () {
    var result = getSessionResult(1);
    assert.equal(result, "[1]");
  });
  it("accepts multiple values", function () {
    var result = getSessionResult(1, 2, 3);
    assert.equal(result, "[1,2,3]");
  });
  it("accepts one empty array at the end", function () {
    var result = getSessionResult([1, 2], [3], []);
    assert.equal(result, "[1,2,3]");
  });
  it("accepts multiple empty arrays", function () {
    var result = getSessionResult([], [], [], []);
    assert.equal(result, "[]");
  });
  it("accepts arrays", function () {
    var result = getSessionResult([1], [], [], [2], []);
    assert.equal(result, "[1,2]");
  });
  it("accepts all weird things", function () {
    var result = getSessionResult([], [1], [2], [], [], 3, 4, []);
    var result2 = getSessionResult([], [1], [2], [], [], 3, 4, [], []);
    var result3 = getSessionResult([], [], [1], [2], [], [], 3, 4, [], []);
    var result4 = getSessionResult([1], [2], [], [], 3, 4, [], []);
    var result5 = getSessionResult([1, 2, 3, 4]);
    assert.equal(result, "[1,2,3,4]");
    assert.equal(result2, "[1,2,3,4]");
    assert.equal(result3, "[1,2,3,4]");
    assert.equal(result4, "[1,2,3,4]");
    assert.equal(result5, "[1,2,3,4]");
  });
});
