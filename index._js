import { isArray, objectAssign, isUrl, compact, root } from "./lib/util";
import { streamToPromise } from "./lib/promisify";
import absolutes from "./lib/absolutes";
import streamHelper from "./lib/stream";
import Crawler from "x-ray-crawler";
import { resolve } from "./lib/resolve";
import { params } from "./lib/params";
import { walk } from "./lib/walk";
import Debug from "debug";
import cheerio from "cheerio";
import enstore from "enstore";

const debug = Debug("ts-ray");

var fs = require("fs");

var CONST = {
  CRAWLER_METHODS: [
    "concurrency",
    "throttle",
    "timeout",
    "driver",
    "delay",
    "limit",
    "abort",
  ],
  INIT_STATE: {
    stream: false,
    concurrency: Infinity,
    paginate: false,
    limit: Infinity,
    abort: false,
  },
};

export interface Options {
  filters: any;
}

export default (xOptions?: Options) => {
  const crawler = Crawler();
  const options = xOptions || ({} as any);
  var filters = options.filters || {};

  const xray = (
    source: string | Cheerio | CheerioAPI | CheerioStatic,
    scope: any,
    selector?: any
  ) => {
    debug("xray params: %j", {
      source: source,
      scope: scope,
      selector: selector,
    });
    var args = params(source, scope, selector);
    selector = args.selector;
    source = args.source;
    scope = args.context;

    var state = objectAssign({}, CONST.INIT_STATE);
    var store = enstore();
    var pages: any[] = [];
    var stream: any;

    var walkHTML = WalkHTML(xray, selector, scope, filters);

    var request = Request(crawler);

    const node = function (source2: any, fn?: any) {
      if (arguments.length === 1) {
        fn = source2;
      } else {
        source = source2;
      }

      debug("params: %j", {
        source: source,
        scope: scope,
        selector: selector,
      });

      if (typeof source === "string" && isUrl(source)) {
        debug("starting at: %s", source);
        request(source, (err: Error, html: string) => {
          if (err) return next(err);
          var $ = load(html, source as string);
          walkHTML($, next);
        });
      } else if (typeof scope === "string" && ~scope.indexOf("@")) {
        debug("resolving to a url: %s", scope);
        var url = resolve(source as any, false, scope, filters);

        // ensure that a@href is a URL
        if (!isUrl(url)) {
          debug("%s is not a url. Skipping!", url);
          return walkHTML(load(""), next);
        }

        debug('resolved "%s" to a %s', scope, url);
        request(url, (err: Error, html: string) => {
          if (err) return next(err);
          var $ = load(html, url);
          walkHTML($, next);
        });
      } else if (source) {
        var $ = load(source);
        walkHTML($, next);
      } else {
        debug("%s is not a url or html. Skipping!", source);
        return walkHTML(load(""), next);
      }

      const next = (err: Error, obj?: any, $?: Cheerio) => {
        if (err) return fn(err);
        var paginate = state.paginate;
        var limit = --state.limit;

        // create the stream
        if (!stream) {
          if (paginate) stream = streamHelper.array(state.stream);
          else stream = streamHelper.object(state.stream);
        }

        if (paginate) {
          if (isArray(obj)) {
            pages = pages.concat(obj);
          } else {
            pages.push(obj);
          }

          if (limit <= 0) {
            debug("reached limit, ending");
            stream(obj, true);
            return fn(null, pages);
          }

          var url = resolve($!, false, paginate, filters);
          debug("paginate(%j) => %j", paginate, url);

          if (!isUrl(url)) {
            debug("%j is not a url, finishing up", url);
            stream(obj, true);
            return fn(null, pages);
          }

          if (state.abort && state.abort(obj, url)) {
            debug("abort check passed, ending");
            stream(obj, true);
            return fn(null, pages);
          }

          stream(obj);

          // debug
          debug("paginating %j", url);
          isFinite(limit) && debug("%s page(s) left to crawl", limit);

          request(url, (err: Error, html: string) => {
            if (err) return next(err);
            var $ = load(html, url);
            walkHTML($, next);
          });
        } else {
          stream(obj, true);
          fn(null, obj);
        }
      };

      return node;
    };

    node.abort = function (validator: any) {
      if (!arguments.length) return state.abort;
      state.abort = validator;
      return node;
    };

    node.paginate = function (paginate?: any) {
      if (!arguments.length) return state.paginate;
      state.paginate = paginate;
      return node;
    };

    node.limit = function (limit?: number) {
      if (!arguments.length) return state.limit;
      state.limit = limit;
      return node;
    };

    node.stream = () => {
      state.stream = store.createWriteStream();
      var rs = store.createReadStream();
      streamHelper.waitCb(rs, node);
      return rs;
    };

    node.write = function (path?: string) {
      if (!arguments.length) return node.stream();
      state.stream = fs.createWriteStream(path);
      streamHelper.waitCb(state.stream, node);
      return state.stream;
    };

    node.then = (resHandler: any, errHandler?: any) => {
      resHandler();
      return streamToPromise(node.stream()).then(resHandler, errHandler);
    };

    return node;
  };

  CONST.CRAWLER_METHODS.forEach(function (method) {
    (xray as any)[method] = function () {
      if (!arguments.length) return (crawler as any)[method]();
      (crawler as any)[method].apply(crawler, arguments);
      return this;
    };
  });

  return xray;
};

const Request = (crawler: any) => {
  return (url: string, fn: any) => {
    debug("fetching %s", url);
    crawler(url, (err: Error, ctx: any) => {
      if (err) return fn(err);
      debug("got response for %s with status code: %s", url, ctx.status);
      return fn(null, ctx.body);
    });
  };
};

function load(html: any, url?: string) {
  html = html || "";
  var $ = html.html ? html : cheerio.load(html);
  if (url) $ = absolutes(url, $);
  return $;
}

function WalkHTML(xray: any, selector: any, scope: any, filters: any) {
  return ($: Cheerio | CheerioAPI, fn: any) => {
    walk(
      selector,
      (v: any, k: any, next: any) => {
        if (typeof v === "string") {
          var value = resolve($!, root(scope), v, filters);
          return next(null, value);
        } else if (typeof v === "function") {
          return v($, (err: Error, obj: any) => {
            if (err) return next(err);
            return next(null, obj);
          });
        } else if (isArray(v)) {
          if (typeof v[0] === "string") {
            return next(null, resolve($, root(scope), v, filters));
          } else if (typeof v[0] === "object") {
            var $scope = "find" in $ ? $.find(scope) : $(scope);
            var pending = $scope.length;
            var out: any[] = [];

            // Handle the empty result set (thanks @jenbennings!)
            if (!pending) return next(null, out);

            return $scope.each((i: number, el: CheerioElement) => {
              var $innerscope = $scope.eq(i);
              var node = xray(scope, v[0]);
              node($innerscope, (err: Error, obj: any) => {
                if (err) return next(err);
                out[i] = obj;
                if (!--pending) {
                  return next(null, compact(out));
                }
              });
            });
          }
        }
        return next();
      },
      (err: Error, obj: any) => {
        if (err) return fn(err);
        fn(null, obj, $);
      }
    );
  };
}
