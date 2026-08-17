module.exports=[67698,e=>{"use strict";var t=e.i(43793),n=e.i(63424),a=e.i(75601);let r=e=>e&&e.length?e:null;async function o(e,o){let i=o??await (0,a.getCurrentGuest)();if(!i)return null;let s=e.startsWith("nb-bk-")?e:`nb-bk-${e}`,l=await (0,n.getBookingById)(s);if(!l)return null;let u=l.newbook_booking_id??String(s).replace("nb-bk-",""),d=r(l.check_in),p=r(l.check_out),c=l.details??{},_=c.signature_status??null,g=c.signature_signed_at??null,h=c.signature_document_url??null,y=JSON.stringify(c),m=await t.sql`
    select id from bookings where newbook_booking_id = ${u} limit 1
  `;return m.length>0?(await t.sql`
      update bookings set
        guest_id = ${i.id},
        property_id = ${i.property_id},
        status = ${l.status},
        check_in = ${d},
        check_out = ${p},
        site_or_room = ${l.site_or_room},
        booking_type = ${l.booking_type},
        total_amount = ${l.total_amount},
        balance_due = ${l.balance_due},
        signature_status = ${_},
        signature_signed_at = ${g},
        signature_document_url = ${h},
        details = ${y}::jsonb,
        synced_at = now()
      where id = ${m[0].id}
      returning id, property_id, guest_id, newbook_booking_id,
        check_in, check_out, site_or_room, status, balance_due
    `)[0]:(await t.sql`
    insert into bookings (
      property_id, guest_id, newbook_booking_id, status, check_in, check_out,
      site_or_room, booking_type, total_amount, balance_due,
      signature_status, signature_signed_at, signature_document_url,
      details, synced_at
    ) values (
      ${i.property_id}, ${i.id}, ${u}, ${l.status}, ${d}, ${p},
      ${l.site_or_room}, ${l.booking_type}, ${l.total_amount}, ${l.balance_due},
      ${_}, ${g}, ${h},
      ${y}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `)[0]}e.s(["ensureBookingSynced",0,o])},79146,e=>{"use strict";var t=e.i(47909),n=e.i(74017),a=e.i(96250),r=e.i(59756),o=e.i(61916),i=e.i(74677),s=e.i(69741),l=e.i(16795),u=e.i(87718),d=e.i(95169),p=e.i(47587),c=e.i(66012),_=e.i(70101),g=e.i(26937),h=e.i(10372),y=e.i(93695);e.i(52474);var m=e.i(220),w=e.i(89171),b=e.i(43793),R=e.i(75601),f=e.i(67698);async function v(e){try{let t=await (0,R.requireGuest)(),n=await e.json().catch(()=>({})),a=await b.sql`
      select auto_pay_enabled from guests where id = ${t.id} limit 1
    `;if(a[0]?.auto_pay_enabled)return w.NextResponse.json({data:null,error:"You're already enrolled in AutoPay."},{status:409});let r="string"==typeof n.booking_id&&n.booking_id.trim()?n.booking_id.trim():null;if(!r)return w.NextResponse.json({data:null,error:"A booking is required to enroll in AutoPay."},{status:400});let o=await (0,f.ensureBookingSynced)(r,t);if(!o||o.guest_id!==t.id)return w.NextResponse.json({data:null,error:"Booking not found"},{status:404});let i=await b.sql`
      select id from addon_requests
      where guest_id = ${t.id}
        and addon_type = 'autopay_enrollment'
        and status = 'pending'
      limit 1
    `;if(i[0])return w.NextResponse.json({data:{request_id:i[0].id,status:"pending",message:"Your AutoPay request is already pending — the front desk will follow up shortly."},error:null},{status:200});let s=await b.sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, details
      )
      values (
        ${o.id}, ${t.id}, ${o.property_id}, null,
        'autopay_enrollment', 1, 0, 'pending', 'waived',
        ${JSON.stringify({request_type:"autopay_enrollment",site_or_room:o.site_or_room})}::jsonb
      )
      returning *
    `;return await b.sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${o.property_id}, 'admin', ${o.property_id},
        'AutoPay enrollment requested',
        ${`Guest requested to enroll in AutoPay for ${o.site_or_room??"their booking"}.`},
        'push'
      )
    `,w.NextResponse.json({data:{request_id:s[0].id,status:"pending",message:"AutoPay requested — the front desk will set it up and confirm with you shortly."},error:null},{status:201})}catch(n){let e=n instanceof Error?n.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("POST /api/payments/autopay error:",n),w.NextResponse.json({data:null,error:e},{status:t})}}e.s(["POST",0,v],37601);var k=e.i(37601);let $=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/payments/autopay/route",pathname:"/api/payments/autopay",filename:"route",bundlePath:""},distDir:"/private/tmp/claude-501/lh-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/payments/autopay/route.ts",nextConfigOutput:"standalone",userland:k,...{}}),{workAsyncStorage:E,workUnitAsyncStorage:A,serverHooks:C}=$;async function q(e,t,a){a.requestMeta&&(0,r.setRequestMeta)(e,a.requestMeta),$.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/payments/autopay/route";w=w.replace(/\/index$/,"")||"/";let b=await $.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!b)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:f,nextConfig:v,parsedUrl:k,isDraftMode:E,prerenderManifest:A,routerServerContext:C,isOnDemandRevalidate:q,revalidateOnlyGenerated:x,resolvedPathname:N,clientReferenceManifest:P,serverActionsManifest:S}=b,T=(0,s.normalizeAppPath)(w),O=!!(A.dynamicRoutes[T]||A.routes[N]),I=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,k,!1):t.end("This page could not be found"),null);if(O&&!E){let e=!!A.routes[N],t=A.dynamicRoutes[T];if(t&&!1===t.fallback&&!e){if(v.adapterPath)return await I();throw new y.NoFallbackError}}let j=null;!O||$.isDev||E||(j="/index"===(j=N)?"/":j);let H=!0===$.isDev||!O,U=O&&!H;S&&P&&(0,i.setManifestsSingleton)({page:w,clientReferenceManifest:P,serverActionsManifest:S});let M=e.method||"GET",D=(0,o.getTracer)(),B=D.getActiveScopeSpan(),F=!!(null==C?void 0:C.isWrappedByNextServer),K=!!(0,r.getRequestMeta)(e,"minimalMode"),G=(0,r.getRequestMeta)(e,"incrementalCache")||await $.getIncrementalCache(e,v,A,K);null==G||G.resetRequestCache(),globalThis.__incrementalCache=G;let L={params:f,previewProps:A.preview,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:H,incrementalCache:G,cacheLifeProfiles:v.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,a,r)=>$.onRequestError(e,t,a,r,C)},sharedContext:{buildId:R}},W=new l.NodeNextRequest(e),V=new l.NodeNextResponse(t),X=u.NextRequestAdapter.fromNodeNextRequest(W,(0,u.signalFromNodeResponse)(t));try{let r,i=async e=>$.handle(X,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=D.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=n.get("next.route");if(a){let t=`${M} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),r&&r!==e&&(r.setAttribute("http.route",a),r.updateName(t))}else e.updateName(`${M} ${w}`)}),s=async r=>{var o,s;let l=async({previousCacheEntry:n})=>{try{if(!K&&q&&x&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(r);e.fetchMetrics=L.renderOpts.fetchMetrics;let s=L.renderOpts.pendingWaitUntil;s&&a.waitUntil&&(a.waitUntil(s),s=void 0);let l=L.renderOpts.collectedTags;if(!O)return await (0,c.sendResponse)(W,V,o,L.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,_.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[h.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,a=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:m.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:a}}}}catch(t){throw(null==n?void 0:n.isStale)&&await $.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:q})},!1,C),t}},u=await $.handleResponse({req:e,nextConfig:v,cacheKey:j,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:q,revalidateOnlyGenerated:x,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:K});if(!O)return null;if((null==u||null==(o=u.value)?void 0:o.kind)!==m.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(s=u.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",q?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,_.fromNodeOutgoingHttpHeaders)(u.value.headers);return K&&O||d.delete(h.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,g.getCacheControlHeader)(u.cacheControl)),await (0,c.sendResponse)(W,V,new Response(u.value.body,{headers:d,status:u.value.status||200})),null};F&&B?await s(B):(r=D.getActiveScopeSpan(),await D.withPropagatedContext(e.headers,()=>D.trace(d.BaseServerSpan.handleRequest,{spanName:`${M} ${w}`,kind:o.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},s),void 0,!F))}catch(t){if(t instanceof y.NoFallbackError||await $.onRequestError(e,t,{routerKind:"App Router",routePath:T,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:q})},!1,C),O)throw t;return await (0,c.sendResponse)(W,V,new Response(null,{status:500})),null}}e.s(["handler",0,q,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:A})},"routeModule",0,$,"serverHooks",0,C,"workAsyncStorage",0,E,"workUnitAsyncStorage",0,A],79146)}];

//# sourceMappingURL=_0k~z1wq._.js.map