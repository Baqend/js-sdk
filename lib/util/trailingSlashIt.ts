'use strict';

/**
 * Adds a trailing slash to a string if it is missing
 * @param str
 * @return
 * @name trailingSlashIt
 * @memberOf prototype
 * @function
 */
export function trailingSlashIt(str: string): string {
  if (str.charAt(str.length - 1) !== '/') {
    return str + '/';
  }

  return str;
}
