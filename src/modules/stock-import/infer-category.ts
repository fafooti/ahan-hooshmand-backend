export type CategoryRule = {
  category: string;
  match: (name: string) => boolean;
};

export const CATEGORY_RULES: CategoryRule[] = [
  { category: 'میلگرد', match: (name) => name.includes('میلگرد') },
  { category: 'نبشی', match: (name) => name.includes('نبشی') },
  { category: 'ناودانی', match: (name) => name.includes('ناودانی') },
  { category: 'قوطی', match: (name) => name.includes('قوطی') },
  { category: 'ورق', match: (name) => name.includes('ورق') },
  { category: 'تیرآهن', match: (name) => /تیر\s*آهن|تیرآهن|تیراهن/.test(name) },
  { category: 'لوله', match: (name) => name.includes('لوله') },
  { category: 'سپری', match: (name) => name.includes('سپری') },
  { category: 'تسمه', match: (name) => name.includes('تسمه') },
  { category: 'پانچ', match: (name) => name.includes('پانچ') },
  { category: 'توری', match: (name) => name.includes('توری') },
  { category: 'ستونی', match: (name) => name.includes('ستونی') },
  { category: 'چهارسو', match: (name) => name.includes('چهارسو') },
  { category: 'لقمه', match: (name) => name.includes('لقمه') },
  { category: 'پروفیل', match: (name) => name.includes('پروفیل') || name.includes('چهارچوبی') },
];

/** Infer category name from product name via keyword rules. Fallback: سایر */
export function inferCategory(name: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.match(name)) {
      return rule.category;
    }
  }

  return 'سایر';
}
