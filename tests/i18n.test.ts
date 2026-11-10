import { expect, test } from "vitest";
import { dict } from "../src/i18n/index.ts";

const TU = /\b(Escríbeme|Escribeme|Escanea|Guarda|Llama|Llámame|Inténtalo|Recarga|Revisa|tu|tus|te|tú|contigo|puedes|tienes)\b/;

test("the default Spanish copy is formal (usted) throughout", () => {
  const es = dict("es-MX");
  for (const [k, v] of Object.entries(es)) if (typeof v === "string") expect(TU.test(v), `${k}: ${v}`).toBe(false);
  for (const v of Object.values(es.errors)) expect(TU.test(v), v).toBe(false);
  expect(es.contact).toMatch(/^Escríb(ame|anos)$/);
});

test("both languages have every key, the reference placeholder and every form error reason", () => {
  const es = dict("es-MX");
  const en = dict("en-US");
  expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  expect(Object.keys(es.errors).sort()).toEqual(Object.keys(en.errors).sort());
  for (const t of [es, en]) {
    expect(t.thankYouNumber).toContain("{n}");
    for (const code of ["rate_limited", "turnstile_failed", "consent_required", "invalid_body", "unknown_site", "form_closed"]) expect(t.errors[code]).toBeTruthy();
  }
  expect(dict("en-GB").htmlLang).toBe("en");
  expect(dict("es-ES").htmlLang).toBe("es");
});
