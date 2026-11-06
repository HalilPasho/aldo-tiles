import { describe, expect, it } from 'vitest';
import business from '../../src/data/business.json';

describe('business.json', () => {
  const facts = [
    business.siteUrl,
    business.phone,
    business.email,
    business.areasServed,
    business.yearsExperience,
    business.credentials,
  ];

  it('samples imply launchReady false', () => {
    if (facts.some((fact) => fact.sample)) {
      expect(business.launchReady).toBe(false);
    }
  });

  it('phone sample uses the fictional number', () => {
    if (business.phone.sample) {
      expect(business.phone.e164).toBe('+16475550100');
    }
  });

  it('every changeable fact has a sample flag', () => {
    for (const fact of facts) {
      expect(typeof fact.sample).toBe('boolean');
    }
  });
});
