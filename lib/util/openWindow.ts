/**
 * An window open handler which can be used to open up the OAuth Window
 * @param url Thw URl which should be opened in the Popup
 * @param options Additional window options
 * @param target The target of the window
 * @param title title of the window, if no target was set
 * @return An optional opened window handle which will be returned by the redirect based OAuth flow.
 * If <code>null</code> is returned it indicates that the open window have bee failed
 */
export type OpenWindowHandler = (url: string, options: {
  title: string, target?: string, [option: string]: string | number | undefined }
) => any | null;

export const openWindow: OpenWindowHandler = (url: string, opt: {
  target?: string, title: string, [option: string]: string | number | undefined }) => {
  const { title, ...options } = opt;
  let { target } = opt;

  const str = Object.keys(options)
    .filter((key) => options[key] !== undefined)
    .map((key) => `${key}=${options[key]}`)
    .join(',');

  if (target === '_self') {
    // for app wrappers we need to open the system browser
    if (typeof document === 'undefined' || (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1)) {
      target = '_system';
    }
  }

  if (typeof open !== 'undefined') { // eslint-disable-line no-restricted-globals
    return open(url, (target || title), str); // eslint-disable-line no-restricted-globals
  }

  return null;
};
