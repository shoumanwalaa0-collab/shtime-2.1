const PERMANENT_BLACKLIST_KEY = 'shtime2_permanently_blacklisted_codes_v1';

export const getPermanentUsedCodes = (): string[] => {
  try {
    const raw = localStorage.getItem(PERMANENT_BLACKLIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading permanent blacklisted codes:', e);
  }
  return [];
};

export const savePermanentlyUsedCode = (code: string): void => {
  try {
    const current = getPermanentUsedCodes();
    if (!current.includes(code)) {
      const updated = [...current, code];
      localStorage.setItem(PERMANENT_BLACKLIST_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('Error saving permanent used code:', e);
  }
};
