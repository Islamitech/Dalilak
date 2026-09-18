import { describe, it, expect } from 'vitest';
import { formatWhatsAppPhone, cleanWhatsAppText } from '../src/utils/whatsapp/phoneFormatter';
import {
  GROK_TOOLS,
  getWhatsAppAiConfig,
  isConversationMuted,
  muteConversationForHuman,
  unmuteConversation,
} from '../src/server/whatsapp-ai-agent';
import {
  generateBrandedQrBuffer,
  prepareBusinessGiftPackage,
  getDeliveredGifts,
} from '../src/server/whatsapp-gift-service';
import { Business } from '../src/types';

describe('WhatsApp Phone Formatter Suite', () => {
  it('correctly handles Egyptian numbers starting with 0020 without duplication', () => {
    const formatted = formatWhatsAppPhone('00201012345678');
    expect(formatted).toBe('201012345678');
    expect(formatted).not.toBe('20201012345678');
  });

  it('correctly formats local numbers starting with 0', () => {
    const formatted = formatWhatsAppPhone('01098765432');
    expect(formatted).toBe('201098765432');
  });

  it('preserves numbers already having +20 or international prefixes', () => {
    expect(formatWhatsAppPhone('+201123456789')).toBe('201123456789');
    expect(formatWhatsAppPhone('966512345678')).toBe('966512345678');
  });

  it('cleans hidden unicode and bidi control characters from text', () => {
    const raw = '\u200Eمرحباً\u202A بكم\uFEFF في دليلك\r\n';
    const cleaned = cleanWhatsAppText(raw);
    expect(cleaned).toBe('مرحباً بكم في دليلك');
  });
});

describe('Grok AI Agent Configuration & Tools Suite', () => {
  it('loads valid AI default configuration', () => {
    const cfg = getWhatsAppAiConfig();
    expect(cfg).toBeDefined();
    expect(typeof cfg.enabled).toBe('boolean');
    expect(typeof cfg.humanTakeoverCooldownMinutes).toBe('number');
    expect(cfg.model).toBeDefined();
  });

  it('defines the required Grok tools for autonomous actions', () => {
    const toolNames = GROK_TOOLS.map((t) => t.function.name);
    expect(toolNames).toContain('sendBusinessGiftPackage');
    expect(toolNames).toContain('updateBusinessInformation');
    expect(toolNames).toContain('scheduleFieldRepVisit');
    expect(toolNames).toContain('activateDirectoryBadge');
    expect(toolNames).toContain('escalateToHumanAdmin');
  });

  it('manages human takeover mute state correctly', () => {
    const testPhone = '201999999999';
    expect(isConversationMuted(testPhone)).toBe(false);

    muteConversationForHuman(testPhone, 60);
    expect(isConversationMuted(testPhone)).toBe(true);

    unmuteConversation(testPhone);
    expect(isConversationMuted(testPhone)).toBe(false);
  });
});

describe('WhatsApp Gift & QR Code Delivery Suite', () => {
  it('generates high-resolution PNG QR code buffer for business', async () => {
    const qrBuffer = await generateBrandedQrBuffer('https://www.dalilaak.com/biz/test-biz-123', 'مطعم الاختبار');
    expect(qrBuffer).toBeInstanceOf(Buffer);
    expect(qrBuffer.length).toBeGreaterThan(1000);
    // PNG file header check: 0x89 0x50 0x4E 0x47 (‰PNG)
    expect(qrBuffer[0]).toBe(0x89);
    expect(qrBuffer[1]).toBe(0x50);
    expect(qrBuffer[2]).toBe(0x4e);
    expect(qrBuffer[3]).toBe(0x47);
  });

  it('prepares business gift package with fallback QR when companion design not found', async () => {
    const mockBiz: Business = {
      id: 'mock-biz-999',
      nameAr: 'مطعم السعادة التجريبي',
      category: 'مطاعم',
      governorate: 'الدقهلية',
      city: 'المنصورة',
      street: 'شارع المشاية',
      phone: '01012345678',
      workingHours: '10 AM - 12 AM',
      description: 'أشهى المأكولات والمشروبات',
      lat: 31.04,
      lng: 31.38,
      ownerName: 'محمد أحمد',
      ownerPhone: '01012345678',
      photos: [],
      repId: 'rep-1',
      repName: 'أحمد مندوب',
      packageId: 'gold',
      packageName: 'الباقة الذهبية',
      packagePrice: 500,
      amountPaid: 500,
      paymentStatus: 'fully_paid',
      verificationStatus: 'verified',
      invoiceNumber: 'INV-999',
      invoiceDate: '2026-09-17',
      createdDate: '2026-09-17',
    };

    const pkg = await prepareBusinessGiftPackage(mockBiz);
    expect(pkg).toBeDefined();
    expect(pkg.buffer).toBeInstanceOf(Buffer);
    expect(pkg.caption).toContain('مطعم السعادة التجريبي');
    expect(pkg.source).toBe('generated_qr');
    expect(pkg.targetUrl).toContain('mock-biz-999');
  });

  it('retrieves delivered gifts log array', () => {
    const log = getDeliveredGifts();
    expect(Array.isArray(log)).toBe(true);
  });
});
