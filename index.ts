import { isArray, isUrl, compact, root } from "./lib/util";
import { streamToPromise } from "./lib/promisify";
import absolutes from "./lib/absolutes";
import streamHelper from "./lib/stream";
import Crawler from "x-ray-crawler";
import { resolve, Filters } from "./lib/resolve";
import { params, Selector } from "./lib/params";
import { walk } from "./lib/walk";
import Debug from "debug";
import cheerio from "cheerio";
import enstore from "enstore";
import { isStringArray } from "./lib/typeGuards";

const debug = Debug("ts-ray");

const fs = require("fs");

const CONST: {
  CRAWLER_METHODS: string[];
  INIT_STATE: State;
} = {
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
  filters?: Filters;
}

export interface State {
  stream: boolean;
  concurrency: number;
  paginate: string | false;
  limit: number | ((limit: number) => any);
  abort: boolean | ((validator: any, url?: string) => any);
}

export default (xOptions?: Options) => {
  const crawler = Crawler();
  const options = xOptions || {};
  const filters = options.filters || {};

  const xray = (
    source: Selector | Cheerio | CheerioStatic,
    scope?: Selector,
    selector?: Selector
  ) => {
    debug("xray params: %j", {
      source: source,
      scope: scope,
      selector: selector,
    });
    const args = params(source, scope, selector);
    selector = args.selector;
    source = args.source;
    scope = args.context;

    const state: State = { ...CONST.INIT_STATE };
    const store = enstore();
    let pages: any[] = [];
    let stream: any;

    const walkHTML = WalkHTML(xray, selector, scope, filters);

    const request = Request(crawler);

    const node = function (source2: any, fn?: any) {
      if (!fn) {
        fn = source2;
      } else {
        source = source2;
      }

      debug("params: %j", {
        source: source,
        scope: scope,
        selector: selector,
      });

      const next = (err: Error, obj?: any, $?: CheerioStatic) => {
        if (err) return fn(err);
        const paginate = state.paginate;
        const limit = --(state.limit as number);

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

          const url = resolve($!, false, paginate, filters);
          debug("paginate(%j) => %j", paginate, url);

          if (!isUrl(url)) {
            debug("%j is not a url, finishing up", url);
            stream(obj, true);
            return fn(null, pages);
          }

          if (
            state.abort &&
            typeof state.abort !== "boolean" &&
            state.abort(obj, url)
          ) {
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
            const $ = load(html, url);
            walkHTML($, next);
          });
        } else {
          stream(obj, true);
          fn(null, obj);
        }
      };

      if (typeof source === "string" && isUrl(source)) {
        debug("starting at: %s", source);
        request(source, (err: Error, html: string) => {
          if (err) return next(err);
          const $ = load(html, source as string);
          walkHTML($, next);
        });
      } else if (typeof scope === "string" && ~scope.indexOf("@")) {
        debug("resolving to a url: %s", scope);
        const url = resolve(source as any, false, scope, filters);

        // ensure that a@href is a URL
        if (!isUrl(url)) {
          debug("%s is not a url. Skipping!", url);
          return walkHTML(load(""), next);
        }

        debug('resolved "%s" to a %s', scope, url);
        request(url, (err: Error, html: string) => {
          if (err) return next(err);
          const $ = load(html, url);
          walkHTML($, next);
        });
      } else if (source) {
        const $ = load(source as string | CheerioStatic);
        walkHTML($, next);
      } else {
        debug("%s is not a url or html. Skipping!", source);
        return walkHTML(load(""), next);
      }

      return node;
    };

    node.abort = (validator: (result: any, url?: string) => any) => {
      if (!validator) return state.abort;
      state.abort = validator;
      return node;
    };

    node.paginate = (paginate: string): any => {
      if (!paginate) return state.paginate;
      state.paginate = paginate;
      return node;
    };

    node.limit = (limit?: number) => {
      if (!limit) return state.limit;
      state.limit = limit;
      return node;
    };

    node.stream = () => {
      state.stream = store.createWriteStream();
      const rs = store.createReadStream();
      streamHelper.waitCb(rs, node);
      return rs;
    };

    node.write = function (path?: string) {
      if (!path) return node.stream();
      state.stream = fs.createWriteStream(path);
      streamHelper.waitCb(state.stream, node);
      return state.stream;
    };

    node.then = (resHandler: any, errHandler?: any) => {
      return streamToPromise(node.stream()).then(resHandler, errHandler);
    };

    return node;
  };

  CONST.CRAWLER_METHODS.forEach((...args) => {
    const [method] = args;
    (xray as any)[method] = function () {
      if (!args.length) return (crawler as any)[method]();
      (crawler as any)[method].apply(crawler, args);
      return this;
    };
  });

  return xray;
};

const Request = (crawler: Crawler.Instance) => {
  return (url: string, fn: any) => {
    debug("fetching %s", url);
    crawler(url, (err, ctx) => {
      if (err) return fn(err);
      debug("got response for %s with status code: %s", url, ctx.status);
      return fn(null, ctx.body);
    });
  };
};

const load = (html: string | CheerioStatic, url?: string) => {
  html = html || "";
  let $ = typeof html !== "string" ? html : cheerio.load(html);
  if (url) $ = absolutes(url, $);
  return $;
};

function WalkHTML(xray: any, selector: any, scope: any, filters: Filters) {
  return ($: CheerioStatic | Cheerio, fn: any) => {
    walk(
      selector,
      (v, _k, next) => {
        if (typeof v === "string") {
          const value = resolve($, root(scope), v, filters);
          return next(null, value);
        } else if (typeof v === "function") {
          return v($, (err: Error, obj: any) => {
            if (err) return next(err);
            return next(null, obj);
          });
        } else if (isArray(v)) {
          if (isStringArray(v)) {
            return next(null, resolve($, root(scope), v, filters));
          } else if (typeof v[0] === "object") {
            const $scope = "find" in $ ? ($ as Cheerio).find(scope) : $(scope);
            let pending = $scope.length;
            const out: any[] = [];

            // Handle the empty result set (thanks @jenbennings!)
            if (!pending) return next(null, out);

            return $scope.each((i: number, _el: CheerioElement) => {
              const $innerscope = $scope.eq(i);
              const node = xray(scope, v[0]);
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
      (err, obj) => {
        if (err) return fn(err);
        fn(null, obj, $);
      }
    );
  };
}
