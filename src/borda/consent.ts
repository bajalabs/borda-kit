/**
 * The lead form's consent links the site's privacy notice when site.json names one (privacy_url). The words of the notice
 * inside the consent become the link; a brand's own consent that does not contain them gets the link after it.
 * Without a URL the consent is plain text.
 */
export type ConsentParts = { before: string; link: string | null; after: string };

export function consentParts(consent: string, notice: string, url: string | null | undefined): ConsentParts {
  if (!url) return { before: consent, link: null, after: "" };
  const i = notice ? consent.indexOf(notice) : -1;
  if (i < 0) return { before: `${consent} `, link: notice || url, after: "" };
  return { before: consent.slice(0, i), link: consent.slice(i, i + notice.length), after: consent.slice(i + notice.length) };
}
