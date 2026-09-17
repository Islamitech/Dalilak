import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('OpenAPI 3.0 Standard Contract Verification (GAP-03 / WS-07)', () => {
  const openApiPath = path.resolve(process.cwd(), 'docs/openapi.json');

  it('1. should verify openapi.json exists and is valid JSON', () => {
    expect(fs.existsSync(openApiPath)).toBe(true);
    const content = fs.readFileSync(openApiPath, 'utf-8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  it('2. should adhere to OpenAPI 3.0.x specification structure', () => {
    const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    expect(spec.openapi).toMatch(/^3\.0\.\d+$/);
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toContain('Dalelak');
    expect(spec.info.version).toBe('2.2.0');
    expect(Array.isArray(spec.servers)).toBe(true);
    expect(spec.servers.length).toBeGreaterThanOrEqual(2);
  });

  it('3. should specify all security schemes for HMAC session tokens and super-admin headers', () => {
    const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    const schemes = spec.components?.securitySchemes;
    expect(schemes).toBeDefined();
    expect(schemes.BearerAuth).toBeDefined();
    expect(schemes.BearerAuth.type).toBe('http');
    expect(schemes.BearerAuth.scheme).toBe('bearer');
    expect(schemes.SuperAdminEmail).toBeDefined();
    expect(schemes.SuperAdminPhone).toBeDefined();
  });

  it('4. should document all core platform endpoints across domains', () => {
    const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    const paths = spec.paths;
    expect(paths).toBeDefined();

    // System
    expect(paths['/api/health']?.get).toBeDefined();
    expect(paths['/api/docs/openapi.json']?.get).toBeDefined();

    // Auth & Identity
    expect(paths['/api/auth/login']?.post).toBeDefined();
    expect(paths['/api/auth/logout']?.post).toBeDefined();
    expect(paths['/api/auth/heartbeat']?.post).toBeDefined();
    expect(paths['/api/auth/check-national-id']?.post).toBeDefined();

    // Businesses
    expect(paths['/api/businesses']?.get).toBeDefined();
    expect(paths['/api/businesses']?.post).toBeDefined();
    expect(paths['/api/businesses/{id}']?.get).toBeDefined();
    expect(paths['/api/businesses/{id}']?.put).toBeDefined();
    expect(paths['/api/businesses/{id}']?.delete).toBeDefined();

    // Representatives & PII scrubbing
    expect(paths['/api/representatives']?.get).toBeDefined();
    expect(paths['/api/representatives']?.post).toBeDefined();
    expect(paths['/api/representatives/{id}']?.put).toBeDefined();

    // Financial payouts
    expect(paths['/api/payouts']?.get).toBeDefined();
    expect(paths['/api/payouts']?.post).toBeDefined();
    expect(paths['/api/payouts/{id}']?.put).toBeDefined();

    // WhatsApp dedicated gateway
    expect(paths['/api/admin/whatsapp/health']?.get).toBeDefined();
    expect(paths['/api/admin/whatsapp/broadcast']?.post).toBeDefined();
    expect(paths['/api/admin/whatsapp/broadcast-skip-delay']?.post).toBeDefined();

    // Supabase SSOT sync
    expect(paths['/api/admin/sync-supabase']?.post).toBeDefined();
  });

  it('5. should define required component schemas with appropriate field types', () => {
    const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    const schemas = spec.components?.schemas;
    expect(schemas).toBeDefined();

    // Business schema
    expect(schemas.Business).toBeDefined();
    expect(schemas.Business.required).toContain('id');
    expect(schemas.Business.required).toContain('nameAr');
    expect(schemas.Business.required).toContain('category');
    expect(schemas.Business.required).toContain('governorate');

    // Representative schema
    expect(schemas.Representative).toBeDefined();
    expect(schemas.Representative.required).toContain('id');
    expect(schemas.Representative.required).toContain('name');
    expect(schemas.Representative.required).toContain('phone');

    // Auth schemas
    expect(schemas.LoginRequest).toBeDefined();
    expect(schemas.LoginRequest.required).toContain('login');
    expect(schemas.LoginRequest.required).toContain('password');
    expect(schemas.NationalIdCheckRequest).toBeDefined();
    expect(schemas.NationalIdCheckRequest.required).toContain('nationalId');

    // WhatsApp schema
    expect(schemas.WhatsAppHealthResponse).toBeDefined();
  });

  it('6. should ensure no endpoint is undocumented or missing summary', () => {
    const spec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));
    const paths = spec.paths;

    for (const [pathKey, methods] of Object.entries(paths)) {
      for (const [method, op] of Object.entries(methods as Record<string, any>)) {
        expect(op.summary, `Endpoint ${method.toUpperCase()} ${pathKey} is missing a summary`).toBeTruthy();
        expect(op.tags, `Endpoint ${method.toUpperCase()} ${pathKey} must have at least one tag`).toBeDefined();
        expect(op.responses, `Endpoint ${method.toUpperCase()} ${pathKey} must have responses`).toBeDefined();
      }
    }
  });
});
