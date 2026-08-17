module.exports = [
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getTokenFromRequest",
    ()=>getTokenFromRequest,
    "removeAuthCookie",
    ()=>removeAuthCookie,
    "setAuthCookie",
    ()=>setAuthCookie,
    "signToken",
    ()=>signToken,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-rsc] (ecmascript)");
;
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'auth-token';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
function signToken(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_SECRET, {
        expiresIn: '7d'
    });
}
function verifyToken(token) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
    } catch  {
        return null;
    }
}
function setAuthCookie(response, token) {
    response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        maxAge: MAX_AGE,
        path: '/'
    });
}
function removeAuthCookie(response) {
    response.cookies.set(COOKIE_NAME, '', {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
    });
}
function getTokenFromRequest(request) {
    const cookie = request.cookies.get(COOKIE_NAME);
    return cookie?.value ?? null;
}
}),
"[project]/src/lib/newbook/config.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ============================================================
// Newbook configuration resolution
// ============================================================
//
// Newbook auth = HTTP Basic (username/password issued by support)
// + a per-property `api_key` (the `instances_` prefix is part of
// the key). Long-term these per-property keys should live on the
// `properties` table; for now they come from env so we can stand
// up the integration one property at a time.
// ============================================================
__turbopack_context__.s([
    "getDefaultProperty",
    ()=>getDefaultProperty,
    "getDemoGuestId",
    ()=>getDemoGuestId,
    "getNewBookCredentials",
    ()=>getNewBookCredentials,
    "getPayTemplateId",
    ()=>getPayTemplateId,
    "getRulesTemplateId",
    ()=>getRulesTemplateId
]);
const PROPERTY_ENV = {
    holiday: 'NEWBOOK_API_KEY_HOLIDAY'
};
function required(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Newbook is not configured: missing environment variable ${name}. ` + 'Set it in .env.local (local) or Render env settings (deploys).');
    }
    return value;
}
function getNewBookCredentials(property = getDefaultProperty()) {
    const envName = PROPERTY_ENV[property];
    if (!envName) {
        throw new Error(`Unknown Newbook property "${property}"`);
    }
    return {
        baseUrl: process.env.NEWBOOK_API_BASE_URL || 'https://api.newbook.cloud/rest',
        username: required('NEWBOOK_API_USERNAME'),
        password: required('NEWBOOK_API_PASSWORD'),
        region: process.env.NEWBOOK_API_REGION || 'us',
        apiKey: required(envName)
    };
}
function getDefaultProperty() {
    return process.env.NEWBOOK_DEFAULT_PROPERTY || 'holiday';
}
function getDemoGuestId() {
    return required('NEWBOOK_DEMO_GUEST_ID');
}
/**
 * The Newbook contact-template id whose email carries the guest's
 * "Pay Your Booking Online" link ([booking:view_booking_online:link]).
 * The park creates this template; drop its id here (or set
 * NEWBOOK_PAY_TEMPLATE_ID) to switch on online payment. Until it's set,
 * the Pay button reports that online payment isn't enabled yet.
 */ const PAY_LINK_TEMPLATE_ID = '92'; // Holiday LIVE "Portal Pay Your Balance" template
function getPayTemplateId() {
    return process.env.NEWBOOK_PAY_TEMPLATE_ID || PAY_LINK_TEMPLATE_ID;
}
/**
 * The Newbook contact-template id holding the park's Rules & Regulations
 * body. The guest-facing rules page renders this template's contents (falling
 * back to the built-in copy if it can't be fetched). Holiday = #94.
 */ const RULES_TEMPLATE_ID = '94';
function getRulesTemplateId() {
    return process.env.NEWBOOK_RULES_TEMPLATE_ID || RULES_TEMPLATE_ID;
}
}),
"[project]/src/lib/newbook/client.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NewBookApiError",
    ()=>NewBookApiError,
    "NewBookClient",
    ()=>NewBookClient,
    "createNewBookClient",
    ()=>createNewBookClient
]);
// ============================================================
// Newbook PMS API Client
// ============================================================
//
// The real Newbook API (verified against a live property):
//  - HTTP Basic Auth (support-issued username + password)
//  - POST only; the "action" is the URL path segment
//  - JSON body always carries `region` and (except for the
//    `api_keys` action) the per-property `api_key`
//  - `success` comes back as the STRING "true"/"false"; failures
//    arrive as HTTP 200/401/412 with success:"false" + `message`
// ============================================================
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/newbook/config.ts [app-rsc] (ecmascript)");
;
class NewBookApiError extends Error {
    statusCode;
    response;
    constructor(message, statusCode, response){
        super(message), this.statusCode = statusCode, this.response = response;
        this.name = 'NewBookApiError';
    }
}
class NewBookClient {
    baseUrl;
    authHeader;
    region;
    apiKey;
    constructor(opts){
        this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
        this.authHeader = 'Basic ' + Buffer.from(`${opts.username}:${opts.password}`).toString('base64');
        this.region = opts.region;
        this.apiKey = opts.apiKey;
    }
    /**
   * POST to `${baseUrl}/${action}` with `{ region, api_key, ...params }`.
   * Returns the parsed `data` payload, or throws NewBookApiError when
   * `success !== "true"` (Newbook reports failures in the body).
   *
   * `includeApiKey: false` is only for the `api_keys` bootstrap action.
   */ async request(action, params = {}, opts = {}) {
        const body = {
            region: this.region,
            ...params
        };
        if (opts.includeApiKey !== false) {
            body.api_key = this.apiKey;
        }
        let response;
        try {
            response = await fetch(`${this.baseUrl}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: this.authHeader
                },
                body: JSON.stringify(body),
                cache: 'no-store'
            });
        } catch (error) {
            throw new NewBookApiError(`Failed to reach Newbook: ${error instanceof Error ? error.message : 'network error'}`, 0);
        }
        const raw = await response.text();
        let envelope;
        try {
            envelope = JSON.parse(raw);
        } catch  {
            throw new NewBookApiError(`Newbook returned non-JSON (HTTP ${response.status})`, response.status, raw.slice(0, 500));
        }
        // `success` is the string "true"/"false" — never trust HTTP status alone.
        if (envelope.success !== 'true') {
            throw new NewBookApiError(envelope.message || `Newbook "${action}" failed`, response.status, envelope);
        }
        return envelope.data;
    }
}
function createNewBookClient(property) {
    return new NewBookClient((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getNewBookCredentials"])(property));
}
}),
"[project]/src/lib/db.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sql",
    ()=>sql
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@neondatabase/serverless/index.mjs [app-rsc] (ecmascript)");
;
let _sql = null;
function getSQL() {
    if (!_sql) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        _sql = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["neon"])(process.env.DATABASE_URL);
    }
    return _sql;
}
function sql(strings, ...values) {
    return getSQL()(strings, ...values);
}
}),
"[project]/src/lib/session.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCurrentGuest",
    ()=>getCurrentGuest,
    "getCurrentProperty",
    ()=>getCurrentProperty,
    "getSessionUser",
    ()=>getSessionUser,
    "requireAdmin",
    ()=>requireAdmin,
    "requireGuest",
    ()=>requireGuest,
    "requireSession",
    ()=>requireSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-rsc] (ecmascript)");
;
;
;
const COOKIE_NAME = 'auth-token';
async function getSessionUser() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyToken"])(token);
    if (!payload) return null;
    const newbookGuestId = payload.userId.startsWith('newbook:') ? payload.userId.slice('newbook:'.length) : null;
    return {
        ...payload,
        newbookGuestId
    };
}
async function requireSession() {
    const u = await getSessionUser();
    if (!u) throw new Error('Unauthorized');
    return u;
}
async function requireAdmin() {
    const u = await requireSession();
    if (u.role !== 'admin') throw new Error('Forbidden: admin only');
    return u;
}
async function getCurrentProperty() {
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`
    select id, slug, name from properties where slug = 'holiday' limit 1
  `;
    if (existing.length > 0) return existing[0];
    const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`
    insert into properties (name, slug, branding, contact_info)
    values ('Holiday Motel', 'holiday', '{}'::jsonb, '{}'::jsonb)
    returning id, slug, name
  `;
    return created[0];
}
async function getCurrentGuest() {
    const user = await getSessionUser();
    if (!user || !user.newbookGuestId) return null;
    const property = await getCurrentProperty();
    const existing = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`
    select id, newbook_guest_id, email
    from guests
    where newbook_guest_id = ${user.newbookGuestId}
    limit 1
  `;
    let row = existing[0];
    if (!row) {
        const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`
      insert into guests (newbook_guest_id, email)
      values (${user.newbookGuestId}, ${user.email})
      returning id, newbook_guest_id, email
    `;
        row = created[0];
    }
    // Ensure the guest is linked to the demo property.
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sql"]`
    insert into guest_properties (guest_id, property_id, newbook_guest_id)
    values (${row.id}, ${property.id}, ${user.newbookGuestId})
    on conflict do nothing
  `;
    return {
        ...row,
        property_id: property.id
    };
}
async function requireGuest() {
    const g = await getCurrentGuest();
    if (!g) throw new Error('Unauthorized');
    return g;
}
}),
"[project]/src/lib/newbook/mappers.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ============================================================
// Newbook -> Portal mappers
// ============================================================
//
// Newbook is the source of truth; the portal has no DB-backed
// booking/guest tables yet, so we map Newbook records straight
// into the portal's display types. IDs are derived from Newbook
// IDs so a list item and its detail page resolve to the same
// record without any local persistence.
// ============================================================
__turbopack_context__.s([
    "bookingPortalId",
    ()=>bookingPortalId,
    "guestPortalId",
    ()=>guestPortalId,
    "invoicePortalId",
    ()=>invoicePortalId,
    "mapBooking",
    ()=>mapBooking,
    "mapGuest",
    ()=>mapGuest,
    "mapNewbookInvoice",
    ()=>mapNewbookInvoice,
    "primaryGuest",
    ()=>primaryGuest
]);
const bookingPortalId = (id)=>`nb-bk-${id}`;
const invoicePortalId = (id)=>`nb-inv-${id}`;
const guestPortalId = (id)=>`nb-g-${id}`;
const num = (v)=>{
    const n = parseFloat(String(v ?? '0'));
    return Number.isFinite(n) ? n : 0;
};
/** Newbook dates are "YYYY-MM-DD HH:MM:SS" (property-local). Make them ISO-parseable. */ const toIso = (nbDate)=>nbDate ? nbDate.replace(' ', 'T') : '';
function primaryGuest(b) {
    const guests = b.guests ?? [];
    return guests.find((g)=>String(g.primary_client) === '1') ?? guests[0];
}
function contact(g, type) {
    const hit = g?.contact_details?.find((c)=>c.type?.toLowerCase() === type && c.content);
    return hit?.content ?? null;
}
function mapEquipment(e) {
    const ft = (v)=>{
        const n = num(v);
        return n > 0 ? n : null;
    };
    return {
        name: e.equipment_name || null,
        make: e.equipment_make || null,
        model: e.equipment_model || null,
        type: e.equipment_type_name || null,
        length_ft: ft(e.equipment_length),
        width_ft: ft(e.equipment_width),
        height_ft: ft(e.equipment_height),
        registration: e.equipment_registration || null,
        registration_expires: e.equipment_registration_expiry ? toIso(e.equipment_registration_expiry) : null,
        slideouts: e.slideouts && e.slideouts !== 'none' ? e.slideouts : null
    };
}
function mapInsurance(p) {
    const exp = p.expiry ?? p.expiry_date ?? null;
    return {
        provider: p.provider ?? p.insurer ?? null,
        policy_number: p.policy_number ?? null,
        type: p.type ?? null,
        expires_at: exp ? toIso(exp) : null
    };
}
function mapGuest(g) {
    return {
        newbook_guest_id: String(g.guest_id),
        email: contact(g, 'email') ?? '',
        first_name: g.firstname || null,
        last_name: g.lastname || null,
        phone: contact(g, 'mobile') ?? contact(g, 'phone'),
        address: {
            street: g.street || undefined,
            city: g.city || undefined,
            state: g.state_shortname || g.state_name || undefined,
            zip: g.postcode || undefined,
            country: g.country_code || undefined
        },
        preferences: {},
        equipment: (g.equipment ?? []).map(mapEquipment),
        insurance_policies: [
            ...g.insurance_policies ?? [],
            ...(g.equipment ?? []).flatMap((e)=>e.insurance_policies ?? [])
        ].map(mapInsurance),
        marketing_consent: (()=>{
            const c = g.contact_details?.find((x)=>x.type?.toLowerCase() === 'email' && x.content);
            return c ? !!c.allow_marketing : undefined;
        })(),
        transactional_consent: (()=>{
            const c = g.contact_details?.find((x)=>x.type?.toLowerCase() === 'email' && x.content);
            return c ? !!c.allow_transactional : undefined;
        })()
    };
}
function mapBookingStatus(b) {
    if (b.booking_cancelled) return 'cancelled';
    if (b.booking_checkedout || b.booking_status === 'Departed') return 'checked_out';
    if (b.booking_checkedin || b.booking_status === 'Arrived') return 'checked_in';
    return 'upcoming';
}
function mapBookingType(b) {
    const hay = `${b.category_name ?? ''} ${b.site_name ?? ''}`.toLowerCase();
    if (/(cabin|cottage)/.test(hay)) return 'cabin';
    if (/(mobile|manufactured)/.test(hay)) return 'mobile_home';
    if (/(room|motel|queen|king|suite)/.test(hay)) return 'motel';
    if (/(site|rv|caravan|powered|pull|back-in)/.test(hay)) return 'rv';
    return 'other';
}
function mapNewbookInvoice(inv, portalIds) {
    const total = num(inv.total);
    const paid = num(inv.paid_total);
    const balance = Number((total - paid).toFixed(2));
    const due = inv.due_on ? toIso(inv.due_on) || null : null;
    let status;
    if (balance <= 0.009) status = 'paid';
    else if (paid > 0.009) status = 'partial';
    else if (due && new Date(due) < new Date()) status = 'overdue';
    else status = 'pending';
    const charges = (inv.items ?? []).filter((i)=>i.type !== 'credits');
    const credits = (inv.items ?? []).filter((i)=>i.type === 'credits');
    const lineItems = [
        ...charges.map((i)=>({
                description: i.description,
                quantity: 1,
                unit_price: num(i.amount),
                total: num(i.amount)
            })),
        ...credits.map((i)=>({
                description: i.description,
                quantity: 1,
                unit_price: -num(i.amount),
                total: -num(i.amount)
            }))
    ];
    // Newbook taxes are inclusive; group them for display only.
    const taxByName = new Map();
    for (const item of inv.items ?? []){
        for (const tx of item.taxes ?? []){
            const key = tx.tax_name || 'Tax';
            const cur = taxByName.get(key) ?? {
                amount: 0,
                inclusive: !!tx.tax_inclusive
            };
            cur.amount += num(tx.tax_amount);
            taxByName.set(key, cur);
        }
    }
    const taxes = [
        ...taxByName
    ].map(([name, v])=>({
            name,
            amount: Number(v.amount.toFixed(2)),
            inclusive: v.inclusive
        })).filter((t)=>Math.abs(t.amount) > 0.009);
    return {
        id: invoicePortalId(inv.id),
        booking_id: portalIds.booking_id,
        property_id: portalIds.property_id,
        guest_id: portalIds.guest_id,
        newbook_invoice_id: String(inv.id),
        amount: total,
        amount_paid: paid,
        status,
        due_date: due,
        paid_at: status === 'paid' ? due : null,
        description: inv.description,
        line_items: lineItems,
        taxes,
        // Newbook's own view_link/download_link carry the instance api_key inside
        // a decodable JWT payload, so they must not reach the browser. Point at
        // our proxy, which fetches a fresh link server-side and streams the PDF.
        pdf_url: inv.view_link || inv.download_link ? `/api/invoices/${encodeURIComponent(inv.id)}/pdf` : null,
        synced_at: new Date().toISOString()
    };
}
/**
 * Newbook has no portal-style "invoice" object; a booking's money is
 * spread across `tariffs_quoted` (nightly), `inventory_items` (fees)
 * and `discounts`. We fold those into a single invoice per booking so
 * the portal's invoice/balance UI has something real to render.
 *
 * Only used as a fallback when a booking has no real invoices yet (nothing
 * has been billed), so the guest still sees what their stay will cost.
 */ function deriveInvoice(b, portalIds) {
    const lineItems = [];
    // Nightly tariffs, grouped by label.
    const byLabel = new Map();
    for (const t of b.tariffs_quoted ?? []){
        const amt = num(t.charge_amount);
        const g = byLabel.get(t.label) ?? {
            qty: 0,
            unit: amt,
            total: 0
        };
        g.qty += 1;
        g.total += amt;
        byLabel.set(t.label, g);
    }
    for (const [label, g] of byLabel){
        lineItems.push({
            description: `${label}${g.qty > 1 ? ` — ${g.qty} nights` : ''}`,
            quantity: g.qty,
            unit_price: g.unit,
            total: Number(g.total.toFixed(2))
        });
    }
    // Fees / extras.
    for (const item of b.inventory_items ?? []){
        lineItems.push({
            description: item.description || item.name,
            quantity: 1,
            unit_price: num(item.amount),
            total: num(item.amount)
        });
    }
    // Discounts (negative line).
    const discountTotal = num(b.discount_total);
    if (discountTotal > 0) {
        lineItems.push({
            description: 'Discount',
            quantity: 1,
            unit_price: -discountTotal,
            total: -discountTotal
        });
    }
    // Taxes across all tariff nights, grouped by tax name (booking_total is
    // already tax-inclusive; this is the itemized breakdown for display).
    const taxByName = new Map();
    for (const t of b.tariffs_quoted ?? []){
        for (const tx of t.taxes ?? []){
            const key = tx.tax_name || 'Tax';
            const cur = taxByName.get(key) ?? {
                amount: 0,
                inclusive: !!tx.tax_inclusive
            };
            cur.amount += num(tx.tax_amount);
            taxByName.set(key, cur);
        }
    }
    const taxes = [
        ...taxByName
    ].map(([name, v])=>({
            name,
            amount: Number(v.amount.toFixed(2)),
            inclusive: v.inclusive
        })).filter((t)=>Math.abs(t.amount) > 0.001);
    const amount = num(b.booking_total);
    const balance = num(b.account_balance);
    const departed = !!b.booking_checkedout || b.booking_status === 'Departed';
    let status;
    if (balance <= 0) status = 'paid';
    else if (new Date(toIso(b.booking_departure)) < new Date() && !departed) status = 'overdue';
    else if (balance < amount) status = 'partial';
    else status = 'pending';
    return {
        id: invoicePortalId(b.booking_id),
        booking_id: bookingPortalId(b.booking_id),
        property_id: portalIds.property_id,
        guest_id: portalIds.guest_id,
        newbook_invoice_id: String(b.booking_id),
        amount,
        amount_paid: Number(Math.max(0, amount - balance).toFixed(2)),
        status,
        due_date: toIso(b.booking_arrival) || null,
        paid_at: status === 'paid' ? toIso(b.booking_modified) || null : null,
        description: `${b.site_name ?? b.category_name ?? 'Stay'}` + ` — ${b.booking_arrival.slice(0, 10)} to ${b.booking_departure.slice(0, 10)}`,
        line_items: lineItems,
        taxes,
        synced_at: new Date().toISOString()
    };
}
// Newbook field names for the rules & regs signature flow are not
// confirmed yet; we read several likely shapes and surface whatever
// we find. TODO: Pin these to real Newbook keys once verified
// against a booking that has actually been signed.
function mapSignatureInfo(b) {
    const raw = b;
    const explicit = typeof raw.signature_status === 'string' && raw.signature_status || typeof raw.signed_status === 'string' && raw.signed_status || null;
    const url = typeof raw.signed_document_url === 'string' && raw.signed_document_url || typeof raw.signature_document_url === 'string' && raw.signature_document_url || typeof raw.signature_url === 'string' && raw.signature_url || null;
    const signedAtRaw = typeof raw.signed_at === 'string' && raw.signed_at || typeof raw.signature_signed_at === 'string' && raw.signature_signed_at || null;
    // TODO: confirm whether Newbook nests this under `documents: [...]`
    // with type/category=='rules_and_regs' rather than top-level fields.
    const docs = Array.isArray(raw.documents) ? raw.documents : null;
    const rulesDoc = docs?.find((d)=>{
        const t = String(d.type ?? d.category ?? d.name ?? '').toLowerCase();
        return /rules|regulation|terms|agreement/.test(t);
    });
    const docUrl = url ?? (rulesDoc && typeof rulesDoc.url === 'string' ? rulesDoc.url : null) ?? (rulesDoc && typeof rulesDoc.signed_url === 'string' ? rulesDoc.signed_url : null);
    const docSignedAt = signedAtRaw ?? (rulesDoc && typeof rulesDoc.signed_at === 'string' ? rulesDoc.signed_at : null);
    const docStatus = explicit ?? (rulesDoc && typeof rulesDoc.status === 'string' ? rulesDoc.status : null);
    let status;
    const norm = docStatus?.toLowerCase() ?? '';
    if (/signed|complete|done/.test(norm) || docSignedAt) {
        status = 'signed';
    } else if (/pending|required|awaiting|unsigned/.test(norm) || docUrl) {
        status = 'pending';
    } else {
        // TODO: default once Newbook's signature flow is confirmed —
        // for now assume the property doesn't require a signature.
        status = 'not_required';
    }
    return {
        signature_status: status,
        signature_signed_at: docSignedAt ? toIso(docSignedAt) : null,
        signature_document_url: docUrl
    };
}
/** Map a Newbook booking to a fully-populated portal Booking. */ // ── Payment-plan schedule ──────────────────────────────────────────────────
// Some bookings carry Newbook payment-plan installments (authoritative:
// amount + due date + paid status). Those become one invoice per instalment.
//
// This used to ALSO expand a monthly repeat charge into one invoice per month
// for the whole stay, guessing which months were paid by spreading the
// account balance earliest-first. That invented invoices Newbook had not
// issued and reported unbilled future months as "Paid". Real invoices now
// come from invoices_list (see mapNewbookInvoice); this is only the
// payment-plan case, which is real data.
function paymentPlanStatus(raw, dueIso) {
    const s = (raw ?? '').toLowerCase();
    if (/paid|complete|processed|success|settled/.test(s)) return 'paid';
    if (dueIso && new Date(dueIso) < new Date()) return 'overdue';
    return 'pending';
}
function deriveScheduledInvoices(b, base) {
    const money = (n)=>Number(n.toFixed(2));
    // 1) Payment-plan installments — authoritative amounts, dates and status.
    const plans = b.payment_plans ?? [];
    if (plans.length >= 2) {
        return plans.map((p, i)=>{
            const amount = money(num(p.amount));
            const raw = p.due_date ?? p.date;
            const due = raw ? toIso(String(raw)) || null : null;
            const status = paymentPlanStatus(p.status, due);
            const label = (p.description ?? '').trim() || `Payment ${i + 1} of ${plans.length}`;
            return {
                ...base,
                id: `${base.id}-pp-${i + 1}`,
                newbook_invoice_id: `${b.booking_id}-pp-${i + 1}`,
                amount,
                amount_paid: status === 'paid' ? amount : 0,
                status,
                due_date: due,
                paid_at: status === 'paid' ? due : null,
                description: label,
                line_items: [
                    {
                        description: label,
                        quantity: 1,
                        unit_price: amount,
                        total: amount
                    }
                ],
                taxes: []
            };
        });
    }
    return null;
}
function mapBooking(b, property, opts = {}) {
    const lead = primaryGuest(b);
    const guest_id = opts.guestId ?? guestPortalId(lead?.guest_id ?? 'unknown');
    const invoice = deriveInvoice(b, {
        property_id: property.id,
        guest_id
    });
    const scheduledInvoices = deriveScheduledInvoices(b, invoice);
    const signature = mapSignatureInfo(b);
    const recurringCharges = (b.repeat_charges ?? []).filter((rc)=>String(rc.guest_visible) === '1').map((rc)=>({
            description: rc.description,
            amount: num(rc.amount),
            interval_label: rc.interval_label || rc.interval || 'Recurring',
            next_run: rc.next_run ? toIso(rc.next_run) : null,
            period_from: rc.period_from ? toIso(rc.period_from) : null,
            period_to: rc.period_to ? toIso(rc.period_to) : null,
            status: rc.status || 'Active'
        }));
    const paymentPlans = (b.payment_plans ?? []).map((p)=>({
            description: p.description ?? null,
            amount: num(p.amount),
            due_date: p.due_date ?? p.date ? toIso(String(p.due_date ?? p.date)) : null,
            status: p.status ?? null
        }));
    const additionalGuests = (b.guests ?? []).filter((g)=>String(g.primary_client) !== '1').map((g)=>({
            name: [
                g.firstname,
                g.lastname
            ].filter(Boolean).join(' ') || 'Guest',
            type: null
        }));
    return {
        id: bookingPortalId(b.booking_id),
        property_id: property.id,
        guest_id,
        newbook_booking_id: String(b.booking_id),
        status: mapBookingStatus(b),
        check_in: toIso(b.booking_arrival),
        check_out: toIso(b.booking_departure),
        site_or_room: b.site_name ?? b.category_name ?? null,
        booking_type: mapBookingType(b),
        group_booking_id: b.bookings_group_id ? String(b.bookings_group_id) : null,
        total_amount: num(b.booking_total),
        balance_due: num(b.account_balance),
        eta: b.booking_eta || null,
        recurring_charges: recurringCharges,
        payment_plans: paymentPlans,
        additional_guests: additionalGuests,
        equipment: (lead?.equipment ?? []).map(mapEquipment),
        required_checkin_document_ids: b.required_checkin_documents_ids ?? [],
        details: {
            adults: num(b.booking_adults),
            children: num(b.booking_children),
            infants: num(b.booking_infants),
            animals: num(b.booking_animals),
            category: b.category_name ?? undefined,
            newbook_status: b.booking_status,
            cancelled_reason: b.booking_cancelled_reason_name ?? undefined,
            equipment: lead?.equipment?.map((e)=>({
                    name: e.equipment_name,
                    make: e.equipment_make,
                    model: e.equipment_model,
                    length: e.equipment_length,
                    unit: e.equipment_measurement_unit
                })),
            signature_status: signature.signature_status,
            signature_signed_at: signature.signature_signed_at,
            signature_document_url: signature.signature_document_url
        },
        synced_at: new Date().toISOString(),
        created_at: toIso(b.booking_placed) || new Date().toISOString(),
        property,
        // Real Newbook invoices when the booking has been billed; otherwise the
        // payment-plan schedule (also real Newbook data), else a single estimate
        // of the whole stay. Nothing here is invented.
        invoices: opts.invoices?.length ? opts.invoices : scheduledInvoices ?? [
            invoice
        ]
    };
}
}),
"[project]/src/lib/newbook/fixtures.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ============================================================
// Offline fallback snapshot (dev only)
// ============================================================
//
// A small, faithful snapshot of the demo guest's Newbook data
// (Timothy Moore, guest 5170 at TRAINING Holiday Motel). Used
// ONLY when NEWBOOK_OFFLINE_FALLBACK=true AND the live API is
// unreachable (e.g. an upstream Cloudflare rate-limit), so the
// portal stays usable for local dev/demos. Live data resumes
// automatically the moment Newbook is reachable again.
//
// This is a point-in-time copy, not live — never enable the flag
// in production.
// ============================================================
__turbopack_context__.s([
    "DEMO_RAW_BOOKINGS",
    ()=>DEMO_RAW_BOOKINGS
]);
const TIMOTHY = {
    guest_id: "5170",
    id: "5170",
    firstname: "Timothy",
    lastname: "Moore",
    primary_client: "1",
    contact_details: [
        {
            id: "1",
            type: "email",
            content: "timothy.moore@example.com"
        },
        {
            id: "2",
            type: "mobile",
            content: "+1 208 555 0170"
        }
    ],
    street: "",
    city: "Emmett",
    state_shortname: "ID",
    state_name: "Idaho",
    postcode: "83617",
    country_code: "US",
    account_id: "5170",
    account_balance: "0.00",
    equipment: [],
    date_created: "2023-12-01 09:00:00",
    modified_when: "2026-05-01 09:00:00"
};
function booking(partial) {
    return {
        booking_cancelled: null,
        booking_length: 1,
        booking_adults: "2",
        booking_children: "0",
        booking_infants: "0",
        booking_animals: "0",
        booking_placed: "2026-01-01 09:00:00",
        booking_modified: "2026-05-01 09:00:00",
        account_id: "5170",
        account_balance: "0.00",
        tariffs_quoted: [],
        inventory_items: [],
        discounts: [],
        discount_total: "0.00",
        guests: [
            TIMOTHY
        ],
        ...partial
    };
}
const DEMO_RAW_BOOKINGS = [
    booking({
        booking_id: 31329959,
        booking_status: "Confirmed",
        booking_arrival: "2026-06-12 15:00:00",
        booking_departure: "2026-06-14 11:00:00",
        booking_checkedin: null,
        booking_checkedout: null,
        site_name: "Room #11 [2Q]",
        category_name: "Double Queen Room",
        booking_total: "266.40"
    }),
    booking({
        booking_id: 31329906,
        booking_status: "Arrived",
        booking_arrival: "2026-03-18 15:00:00",
        booking_departure: "2026-05-18 11:00:00",
        booking_checkedin: "2026-03-18 16:02:59",
        booking_checkedout: null,
        site_name: "Site 07",
        category_name: "RV Site",
        booking_total: "2600.00"
    }),
    booking({
        booking_id: 31267342,
        booking_status: "Departed",
        booking_arrival: "2026-02-18 15:00:00",
        booking_departure: "2026-03-18 11:00:00",
        booking_checkedin: "2026-02-18 15:30:00",
        booking_checkedout: "2026-03-18 10:30:00",
        site_name: "Site 07",
        category_name: "RV Site",
        booking_total: "650.00"
    })
];
}),
"[project]/src/lib/newbook/data.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ============================================================
// Newbook data layer (server-only)
// ============================================================
//
// The portal has no booking/guest DB tables yet, so pages and
// API routes read live from Newbook through here. Scoped to the
// fixed demo guest (see config.getDemoGuestId) until a real
// portal-login <-> Newbook-guest mapping exists.
//
// Credentials never cross to the client: only mapped portal
// types leave this module, and Property.newbook_api_key is null.
// ============================================================
__turbopack_context__.s([
    "NoLinkedGuestError",
    ()=>NoLinkedGuestError,
    "getBookingById",
    ()=>getBookingById,
    "getBookings",
    ()=>getBookings,
    "getDemoGuest",
    ()=>getDemoGuest,
    "getProperty",
    ()=>getProperty
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/newbook/client.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/newbook/config.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/session.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/newbook/mappers.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$fixtures$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/newbook/fixtures.ts [app-rsc] (ecmascript)");
;
;
;
;
;
class NoLinkedGuestError extends Error {
    constructor(){
        super('NO_LINKED_GUEST');
        this.name = 'NoLinkedGuestError';
    }
}
/**
 * Resolve WHICH guest's data to read: an explicit override (trusted server
 * code) else the signed-in guest's Newbook id from the JWT. Throws rather
 * than ever falling back to someone else's data.
 */ async function resolveGuestId(explicit) {
    if (explicit) return explicit;
    const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$session$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSessionUser"])();
    if (user?.newbookGuestId) return user.newbookGuestId;
    throw new NoLinkedGuestError();
}
const PROPERTY_PROFILES = {
    holiday: {
        id: 'holiday',
        name: 'Holiday Motel and RV Park',
        slug: 'holiday-motel',
        owner_legal_name: 'Holiday Holdings LLC',
        newbook_instance_url: null,
        newbook_api_key: null,
        timezone: 'America/Boise',
        cancellation_policy: {
            refund_eligible: true,
            cutoff_days: 7,
            policy_text: 'Full refund if cancelled 7 or more days before arrival. ' + 'Within 7 days the first night is non-refundable. ' + 'Please contact the front desk for assistance.'
        },
        features_enabled: {
            check_in: true,
            food_trucks: false,
            local_guide: false,
            push_notifications: true,
            add_ons: true,
            document_uploads: true
        },
        contact_info: {
            phone: '(208) 365-4479',
            email: 'frontdesk@holidaymotelrv.com'
        },
        smart_lock_provider: null,
        smart_lock_config: {},
        branding: {
            // Drop the park's logo at public/brands/holiday-motel/logo.png
            // (transparent PNG preferred). Falls back to a name monogram
            // until the file exists.
            logo_url: '/brands/holiday-motel/logo.png',
            primary_color: '#b47a24',
            accent_color: '#fdf8f0',
            welcome_message: 'Welcome to Holiday Motel and RV Park — we are glad to have you.'
        },
        created_at: '2024-01-01T00:00:00Z'
    }
};
function getProperty() {
    return PROPERTY_PROFILES[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDefaultProperty"])()] ?? PROPERTY_PROFILES.holiday;
}
// One cached raw bookings_list response feeds BOTH getBookings and
// getDemoGuest, so a portal page load makes a single Newbook call
// (not one per consumer). Newbook sits behind Cloudflare and will
// rate-limit/403 a chatty client, so we also negative-cache failures
// briefly to avoid hammering during an outage or block.
const SUCCESS_TTL_MS = 5 * 60_000;
const FAILURE_TTL_MS = 30_000;
let rawCache = null;
let failCache = null;
/** Dev-only: serve a snapshot when the live API is unreachable. */ function offlineFallbackEnabled() {
    return process.env.NEWBOOK_OFFLINE_FALLBACK === "true";
}
async function fetchRawBookings(guestId) {
    const key = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDefaultProperty"])()}:${guestId}`;
    const now = Date.now();
    if (rawCache && rawCache.key === key && now - rawCache.at < SUCCESS_TTL_MS) {
        return rawCache.raw;
    }
    // We failed recently — don't pelt a blocked endpoint. Serve the
    // offline snapshot if enabled, otherwise surface the error.
    if (failCache && failCache.key === key && now - failCache.at < FAILURE_TTL_MS) {
        if (offlineFallbackEnabled()) return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$fixtures$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEMO_RAW_BOOKINGS"];
        throw failCache.error;
    }
    try {
        const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createNewBookClient"])();
        const raw = await client.request('bookings_list', {
            period_from: '2020-01-01 00:00:00',
            period_to: '2035-12-31 00:00:00',
            list_type: 'staying',
            guest_id: Number(guestId)
        });
        const list = Array.isArray(raw) ? raw : [];
        rawCache = {
            key,
            at: Date.now(),
            raw: list
        };
        failCache = null;
        return list;
    } catch (error) {
        failCache = {
            key,
            at: Date.now(),
            error: error instanceof Error ? error : new Error(String(error))
        };
        if (offlineFallbackEnabled()) {
            console.warn("Newbook unreachable — serving offline snapshot (NEWBOOK_OFFLINE_FALLBACK). Live data resumes when the API is reachable.");
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$fixtures$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["DEMO_RAW_BOOKINGS"];
        }
        throw error;
    }
}
// Real invoices, keyed by the set of client accounts requested. Newbook bills
// a long stay one period at a time, so this is the only accurate picture of
// what a guest has actually been invoiced (and paid) to date.
let invoiceCache = null;
async function fetchRawInvoices(accountIds) {
    if (accountIds.length === 0) return [];
    const key = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$config$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDefaultProperty"])()}:${[
        ...accountIds
    ].sort().join(',')}`;
    const now = Date.now();
    if (invoiceCache && invoiceCache.key === key && now - invoiceCache.at < SUCCESS_TTL_MS) {
        return invoiceCache.raw;
    }
    try {
        const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$client$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createNewBookClient"])();
        const raw = await client.request('invoices_list', {
            account_id: accountIds,
            account_for: 'bookings',
            fetch_items: true,
            data_limit: 1000
        });
        const list = Array.isArray(raw) ? raw : [];
        invoiceCache = {
            key,
            at: Date.now(),
            raw: list
        };
        return list;
    } catch (error) {
        // The booking itself still renders; it just falls back to the
        // whole-stay estimate rather than the per-period invoices.
        console.warn('Newbook invoices_list unavailable, falling back to derived invoice:', error instanceof Error ? error.message : error);
        return [];
    }
}
async function getBookings(guestId) {
    const property = getProperty();
    const id = await resolveGuestId(guestId);
    const raw = await fetchRawBookings(id);
    const accountIds = [
        ...new Set(raw.map((b)=>b.account_id).filter((a)=>typeof a === 'string' && a.length > 0))
    ];
    const rawInvoices = await fetchRawInvoices(accountIds);
    // invoices_list reports the booking on `account_for_id`.
    const byBooking = new Map();
    for (const inv of rawInvoices){
        if (inv.voided_when) continue;
        if (inv.account_for !== 'bookings') continue;
        const bookingId = String(inv.account_for_id);
        const list = byBooking.get(bookingId) ?? [];
        list.push(inv);
        byBooking.set(bookingId, list);
    }
    const guest_id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["guestPortalId"])(id);
    return raw.map((b)=>{
        const invoices = (byBooking.get(String(b.booking_id)) ?? []).sort((x, y)=>(x.due_on ?? '').localeCompare(y.due_on ?? '')).map((inv)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mapNewbookInvoice"])(inv, {
                property_id: property.id,
                guest_id,
                booking_id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["bookingPortalId"])(b.booking_id)
            }));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mapBooking"])(b, property, {
            guestId: guest_id,
            invoices
        });
    }).sort((a, b)=>new Date(b.check_in).getTime() - new Date(a.check_in).getTime());
}
async function getBookingById(portalId, guestId) {
    const bookings = await getBookings(guestId);
    return bookings.find((b)=>b.id === portalId) ?? null;
}
async function getDemoGuest(guestId) {
    const id = await resolveGuestId(guestId);
    const raw = await fetchRawBookings(id);
    for (const b of raw){
        const lead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["primaryGuest"])(b);
        if (lead) {
            return {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["guestPortalId"])(lead.guest_id),
                auth_user_id: `newbook:${lead.guest_id}`,
                created_at: lead.date_created ? lead.date_created.replace(' ', 'T') : new Date().toISOString(),
                updated_at: lead.modified_when ? lead.modified_when.replace(' ', 'T') : new Date().toISOString(),
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$mappers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["mapGuest"])(lead)
            };
        }
    }
    return null;
}
}),
"[project]/src/lib/context/guest-context.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GuestProvider",
    ()=>GuestProvider,
    "useGuest",
    ()=>useGuest
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const GuestProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call GuestProvider() from the server but GuestProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/lib/context/guest-context.tsx <module evaluation>", "GuestProvider");
const useGuest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call useGuest() from the server but useGuest is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/lib/context/guest-context.tsx <module evaluation>", "useGuest");
}),
"[project]/src/lib/context/guest-context.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GuestProvider",
    ()=>GuestProvider,
    "useGuest",
    ()=>useGuest
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const GuestProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call GuestProvider() from the server but GuestProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/lib/context/guest-context.tsx", "GuestProvider");
const useGuest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call useGuest() from the server but useGuest is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/lib/context/guest-context.tsx", "useGuest");
}),
"[project]/src/lib/context/guest-context.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$context$2f$guest$2d$context$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/lib/context/guest-context.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$context$2f$guest$2d$context$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/lib/context/guest-context.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$context$2f$guest$2d$context$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/(portal)/portal-shell.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PortalShell",
    ()=>PortalShell
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const PortalShell = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call PortalShell() from the server but PortalShell is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/(portal)/portal-shell.tsx <module evaluation>", "PortalShell");
}),
"[project]/src/app/(portal)/portal-shell.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PortalShell",
    ()=>PortalShell
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const PortalShell = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call PortalShell() from the server but PortalShell is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/(portal)/portal-shell.tsx", "PortalShell");
}),
"[project]/src/app/(portal)/portal-shell.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$portal$292f$portal$2d$shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/(portal)/portal-shell.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$portal$292f$portal$2d$shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/app/(portal)/portal-shell.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$portal$292f$portal$2d$shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/(portal)/layout.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PortalLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$api$2f$navigation$2e$react$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/api/navigation.react-server.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/newbook/data.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$context$2f$guest$2d$context$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/context/guest-context.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$portal$292f$portal$2d$shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/app/(portal)/portal-shell.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
async function PortalLayout({ children }) {
    let guest = null;
    let property = null;
    let session = {
        id: "demo",
        email: "guest@demo.com"
    };
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const token = cookieStore.get("auth-token")?.value;
    const payload = token ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["verifyToken"])(token) : null;
    if (!payload) {
        // Allow demo mode in development
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    } else {
        // Session is tied to the Newbook demo guest; resolve identity and
        // property straight from Newbook (no portal user DB yet).
        // Always have the property (static); guest comes from Newbook and
        // may be briefly unavailable (e.g. upstream rate-limit) — degrade
        // quietly rather than crashing the whole portal shell.
        property = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getProperty"])();
        try {
            guest = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$newbook$2f$data$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getDemoGuest"])();
        } catch (error) {
            console.warn("Newbook guest lookup unavailable, rendering portal without guest profile:", error instanceof Error ? error.message : error);
        }
        session = {
            id: payload.userId,
            email: payload.email
        };
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$context$2f$guest$2d$context$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["GuestProvider"], {
        guest: guest,
        property: property,
        session: session,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f28$portal$292f$portal$2d$shell$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PortalShell"], {
            children: children
        }, void 0, false, {
            fileName: "[project]/src/app/(portal)/layout.tsx",
            lineNumber: 51,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/(portal)/layout.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/(portal)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(portal)/layout.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0_gwkss._.js.map