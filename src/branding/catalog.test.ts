import { describe, expect, it } from 'vitest';
import { getAcademyBrand } from './catalog.lookup';
import { getManzurCopy } from './manzurCopy';

describe('fixed web academy identities', () => {
  it('keeps independent names, domains and PWA scopes', () => {
    const hamarr = getAcademyBrand('hamarr');
    const manzur = getAcademyBrand('manzur');
    expect(hamarr.siteUrl).toBe('https://hamarr.cl');
    expect(manzur.siteUrl).toBe('https://manzurbros.pages.dev');
    expect(hamarr.pageTitle).not.toEqual(manzur.pageTitle);
    expect(hamarr.pwaCacheName).not.toEqual(manzur.pwaCacheName);
    expect(manzur.iconUrl).not.toEqual(hamarr.iconUrl);
    expect(manzur.instagramUrl).toBe('https://www.instagram.com/manzur_bros.la');
  });
  it('fails closed for a Manzur Android download before artwork and APK approval', () => {
    expect(getAcademyBrand('manzur').androidApkUrl).toBeNull();
    expect(getAcademyBrand('hamarr').androidApkUrl).toBe('/downloads/hamarr-app-latest.apk');
  });
  it('provides localized Manzur pages without HAMARR-derived i18n copy', () => {
    expect(getManzurCopy('es-CL').heroLeading).toContain('siguiente nivel');
    expect(getManzurCopy('en-US').heroLeading).toContain('next level');
    expect(getManzurCopy('pt-BR').heroLeading).toContain('próximo nível');
    expect(getManzurCopy('invalid').heroLeading).toEqual(getManzurCopy('es').heroLeading);
  });
});
