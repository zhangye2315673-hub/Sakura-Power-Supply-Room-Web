export type TemplateVariantSelection<T> = Readonly<{
  value: T;
  index: number;
}>;

function mixTemplateSeed(seed: number, salt: number): number {
  let mixed = (seed ^ salt) >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x7feb352d);
  mixed ^= mixed >>> 15;
  mixed = Math.imul(mixed, 0x846ca68b);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

export function selectTemplateVariant<T>(
  seed: number,
  variants: readonly T[],
  salt: number,
): TemplateVariantSelection<T> {
  if (variants.length === 0) throw new Error('Cannot select from an empty template pool.');
  const index = mixTemplateSeed(seed, salt) % variants.length;
  return { value: variants[index], index };
}
