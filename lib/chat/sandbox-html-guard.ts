/**
 * Client-side tripwire for sandbox dashboard HTML. Belt-and-suspenders only —
 * the backend (parse5 allowlist + CSP sha256 meta) is the real sanitizer.
 *
 * This intentionally parses with DOMParser and inspects real elements and
 * attributes instead of scanning raw text: lexical checks false-positive on
 * inert content such as a JS comment mentioning `<form>` or an identifier like
 * `monthsCount =`, both of which are harmless and backend-approved. DOMParser
 * never executes scripts or loads resources while parsing.
 */

const FORBIDDEN_ELEMENTS_SELECTOR = 'iframe, form, object, embed';
const URL_ATTRIBUTES = new Set(['href', 'src', 'action', 'formaction']);

/** Returns a short reason when the HTML contains actually-unsafe markup, else null. */
export function findUnsafeSandboxHtmlReason(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const forbidden = doc.querySelector(FORBIDDEN_ELEMENTS_SELECTOR);
  if (forbidden !== null) {
    return `forbidden <${forbidden.tagName.toLowerCase()}> element`;
  }

  for (const element of doc.querySelectorAll('*')) {
    for (const attr of element.attributes) {
      if (/^on/i.test(attr.name)) {
        return `event handler attribute "${attr.name}"`;
      }
      if (URL_ATTRIBUTES.has(attr.name.toLowerCase()) && /^\s*javascript:/i.test(attr.value)) {
        return `javascript: URL in "${attr.name}"`;
      }
    }
  }

  return null;
}
