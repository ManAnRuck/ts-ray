/**
 * Module Dependencies
 */

import { parse, resolve } from "url";

/**
 * Export `absolute`
 */

export default absolute;

/**
 * Selector
 */

const selector = [
  "a[href]",
  "img[src]",
  "script[src]",
  "link[href]",
  "source[src]",
  "track[src]",
  "img[src]",
  "frame[src]",
  "iframe[src]",
].join(",");

/**
 * Checks if a given string is a valid URL
 *
 * @param {String} src
 * @return {Boolean}
 */

function isValidUrl(src: string) {
  try {
    parse(src);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Change all the URLs into absolute urls
 *
 * @param {String} path
 * @param {Cheerio} $
 * @return {$}
 */

function absolute(path: string, $: CheerioStatic) {
  const parts = parse(path);
  let remote = parts.protocol + "//" + parts.host;
  // apply <base> tag transformation
  const base = $("head").find("base");
  if (base.length === 1) {
    var href = base.attr("href");
    if (href) {
      remote = href;
    }
  }
  $(selector).each(abs);

  function abs(_i: number, el: CheerioElement) {
    const $el = $(el);
    let key = null;
    let src = null;

    const hasHref = $el.attr("href");
    const hashSrc = $el.attr("src");

    if (hasHref) {
      key = "href";
      src = hasHref;
    } else if (hashSrc) {
      key = "src";
      src = hashSrc;
    } else {
      return;
    }

    src = src.trim();

    if (~src.indexOf("://")) {
      return;
    } else if (isValidUrl(src)) {
      let current;
      if (href && src.indexOf("/") !== 0) {
        current = resolve(remote, href);
        src = resolve(current, src);
      } else {
        current = resolve(remote, parts.pathname!);
        src = resolve(current, src);
      }
    }

    $el.attr(key, src);
  }

  return $;
}
