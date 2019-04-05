/**
 * A TypeScript port of a subset of is.js (https://github.com/arasatasaygin/is.js)
 * See https://github.com/arasatasaygin/is.js/blob/56294950656ba58f940248510cdf3e45af357a1e/is.js
 * MIT license https://github.com/arasatasaygin/is.js/blob/master/LICENSE
 */

const userAgent = ((navigator && navigator.userAgent) || "").toLowerCase();
const vendor = ((navigator && navigator.vendor) || "").toLowerCase();

export const is = {
  chrome: (): boolean => {
    const match = /google inc/.test(vendor)
      ? userAgent.match(/(?:chrome|crios)\/(\d+)/)
      : null;
    return match !== null && !is.opera();
  },
  opera: (): boolean => {
    const match = userAgent.match(/(?:^opera.+?version|opr)\/(\d+)/);
    return match !== null;
  },
};
