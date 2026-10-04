import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UpgradeCodeDocument {
  id?: string;
  code_string: string;
  is_used: boolean;
  used_by?: string | null;
  used_at?: Timestamp | any | null;
  upgrade_type: string;
  reward_value?: number;
  created_at?: Timestamp | any;
}

export interface PromoCodeVerificationResult {
  success: boolean;
  message: string;
  upgrade_type?: string;
  reward_value?: number;
  error?: string;
}

/**
 * Promo codes system has been cancelled per user request:
 * "ألغى prom و لا يمكن لاي شخص حصل مجان على مال"
 * No free money or promo codes allowed.
 */
export async function verifyAndRedeemPromoCode(
  _rawCodeInput: string,
  _playerIdentifier: string
): Promise<PromoCodeVerificationResult> {
  return {
    success: false,
    message: 'تم إلغاء نظام الأكواد الترويجية (Promo) نهائياً! لا يمكن لأي شخص الحصول مجاناً على مال.',
    error: 'تم إلغاء نظام البرومو (Promo) ومنع الحصول على مال مجاناً.',
  };
}

export async function seedSamplePromoCodes(): Promise<void> {
  // Promo codes are cancelled - do not seed any free money promo codes
}

export async function createCustomPromoCode(
  _codeString: string,
  _upgradeType: string,
  _rewardValue: number
): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'تم إلغاء إنشاء واستخدام الأكواد الترويجية (Promo) نهائياً.',
  };
}

export async function fetchAvailablePromoCodes(): Promise<UpgradeCodeDocument[]> {
  // Promo codes cancelled
  return [];
}
