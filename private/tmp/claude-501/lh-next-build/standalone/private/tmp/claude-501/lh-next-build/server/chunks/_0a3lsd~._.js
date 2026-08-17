module.exports=[67698,e=>{"use strict";var t=e.i(43793),r=e.i(63424),n=e.i(75601);let a=e=>e&&e.length?e:null;async function o(e,o){let i=o??await (0,n.getCurrentGuest)();if(!i)return null;let s=e.startsWith("nb-bk-")?e:`nb-bk-${e}`,l=await (0,r.getBookingById)(s);if(!l)return null;let u=l.newbook_booking_id??String(s).replace("nb-bk-",""),d=a(l.check_in),c=a(l.check_out),p=l.details??{},_=p.signature_status??null,h=p.signature_signed_at??null,g=p.signature_document_url??null,f=JSON.stringify(p),k=await t.sql`
    select id from bookings where newbook_booking_id = ${u} limit 1
  `;return k.length>0?(await t.sql`
      update bookings set
        guest_id = ${i.id},
        property_id = ${i.property_id},
        status = ${l.status},
        check_in = ${d},
        check_out = ${c},
        site_or_room = ${l.site_or_room},
        booking_type = ${l.booking_type},
        total_amount = ${l.total_amount},
        balance_due = ${l.balance_due},
        signature_status = ${_},
        signature_signed_at = ${h},
        signature_document_url = ${g},
        details = ${f}::jsonb,
        synced_at = now()
      where id = ${k[0].id}
      returning id, property_id, guest_id, newbook_booking_id,
        check_in, check_out, site_or_room, status, balance_due
    `)[0]:(await t.sql`
    insert into bookings (
      property_id, guest_id, newbook_booking_id, status, check_in, check_out,
      site_or_room, booking_type, total_amount, balance_due,
      signature_status, signature_signed_at, signature_document_url,
      details, synced_at
    ) values (
      ${i.property_id}, ${i.id}, ${u}, ${l.status}, ${d}, ${c},
      ${l.site_or_room}, ${l.booking_type}, ${l.total_amount}, ${l.balance_due},
      ${_}, ${h}, ${g},
      ${f}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `)[0]}e.s(["ensureBookingSynced",0,o])},58670,e=>{"use strict";var t=e.i(47909),r=e.i(74017),n=e.i(96250),a=e.i(59756),o=e.i(61916),i=e.i(74677),s=e.i(69741),l=e.i(16795),u=e.i(87718),d=e.i(95169),c=e.i(47587),p=e.i(66012),_=e.i(70101),h=e.i(26937),g=e.i(10372),f=e.i(93695);e.i(52474);var k=e.i(220),w=e.i(89171),b=e.i(43793),m=e.i(75601),v=e.i(67698);async function R(e,{params:t}){try{let r=await (0,m.requireGuest)(),{id:n}=await t,a=await e.json();if(!a.scheduled_for)return w.NextResponse.json({data:null,error:"scheduled_for is required"},{status:400});let o=new Date(a.scheduled_for);if(isNaN(o.getTime()))return w.NextResponse.json({data:null,error:"Invalid scheduled_for date"},{status:400});let i=await (0,v.ensureBookingSynced)(n,r);if(!i||i.guest_id!==r.id)return w.NextResponse.json({data:null,error:"Booking not found"},{status:404});let s=await b.sql`
      select id, slug, name, price_cents, requires_approval, active
      from addon_catalog
      where property_id = ${i.property_id} and slug = 'late_checkout'
      limit 1
    `;if(0===s.length||!s[0].active)return w.NextResponse.json({data:null,error:"Late checkout is not offered for this property"},{status:400});let l=s[0],u=!1;if(i.site_or_room&&i.check_out){let e=new Date(i.check_out);e.setHours(0,0,0,0);let t=new Date(e);t.setDate(t.getDate()+1),u=(await b.sql`
        select id from bookings
        where property_id = ${i.property_id}
          and site_or_room = ${i.site_or_room}
          and id <> ${i.id}
          and check_in >= ${e.toISOString()}
          and check_in < ${t.toISOString()}
          and status = any(${["confirmed","upcoming","checked_in"]})
      `).length>0}let d=u?"pending":"auto_approved",c=l.price_cents,p=await b.sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, scheduled_for, details
      )
      values (
        ${i.id}, ${r.id}, ${i.property_id}, ${l.id}, ${l.slug},
        1, ${c}, ${d},
        ${0===c?"waived":"unpaid"},
        ${o.toISOString()},
        ${JSON.stringify({has_conflict:u})}::jsonb
      )
      returning *
    `;return await b.sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${i.property_id}, 'admin', ${i.property_id},
        ${u?"Late checkout requested (conflict — needs review)":"Late checkout auto-approved"},
        ${`Site ${i.site_or_room??"n/a"} until ${o.toISOString()}`},
        'push'
      )
    `,w.NextResponse.json({data:p[0],error:null},{status:201})}catch(r){let e=r instanceof Error?r.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("POST /api/bookings/[id]/late-checkout error:",r),w.NextResponse.json({data:null,error:e},{status:t})}}e.s(["POST",0,R],4031);var y=e.i(4031);let $=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/bookings/[id]/late-checkout/route",pathname:"/api/bookings/[id]/late-checkout",filename:"route",bundlePath:""},distDir:"/private/tmp/claude-501/lh-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/bookings/[id]/late-checkout/route.ts",nextConfigOutput:"standalone",userland:y,...{}}),{workAsyncStorage:E,workUnitAsyncStorage:C,serverHooks:S}=$;async function x(e,t,n){n.requestMeta&&(0,a.setRequestMeta)(e,n.requestMeta),$.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/bookings/[id]/late-checkout/route";w=w.replace(/\/index$/,"")||"/";let b=await $.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!b)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:m,params:v,nextConfig:R,parsedUrl:y,isDraftMode:E,prerenderManifest:C,routerServerContext:S,isOnDemandRevalidate:x,revalidateOnlyGenerated:N,resolvedPathname:q,clientReferenceManifest:A,serverActionsManifest:O}=b,T=(0,s.normalizeAppPath)(w),P=!!(C.dynamicRoutes[T]||C.routes[q]),I=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,y,!1):t.end("This page could not be found"),null);if(P&&!E){let e=!!C.routes[q],t=C.dynamicRoutes[T];if(t&&!1===t.fallback&&!e){if(R.adapterPath)return await I();throw new f.NoFallbackError}}let D=null;!P||$.isDev||E||(D="/index"===(D=q)?"/":D);let H=!0===$.isDev||!P,j=P&&!H;O&&A&&(0,i.setManifestsSingleton)({page:w,clientReferenceManifest:A,serverActionsManifest:O});let U=e.method||"GET",M=(0,o.getTracer)(),B=M.getActiveScopeSpan(),F=!!(null==S?void 0:S.isWrappedByNextServer),K=!!(0,a.getRequestMeta)(e,"minimalMode"),L=(0,a.getRequestMeta)(e,"incrementalCache")||await $.getIncrementalCache(e,R,C,K);null==L||L.resetRequestCache(),globalThis.__incrementalCache=L;let G={params:v,previewProps:C.preview,renderOpts:{experimental:{authInterrupts:!!R.experimental.authInterrupts},cacheComponents:!!R.cacheComponents,supportsDynamicResponse:H,incrementalCache:L,cacheLifeProfiles:R.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,a)=>$.onRequestError(e,t,n,a,S)},sharedContext:{buildId:m}},W=new l.NodeNextRequest(e),V=new l.NodeNextResponse(t),X=u.NextRequestAdapter.fromNodeNextRequest(W,(0,u.signalFromNodeResponse)(t));try{let a,i=async e=>$.handle(X,G).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${U} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),a&&a!==e&&(a.setAttribute("http.route",n),a.updateName(t))}else e.updateName(`${U} ${w}`)}),s=async a=>{var o,s;let l=async({previousCacheEntry:r})=>{try{if(!K&&x&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(a);e.fetchMetrics=G.renderOpts.fetchMetrics;let s=G.renderOpts.pendingWaitUntil;s&&n.waitUntil&&(n.waitUntil(s),s=void 0);let l=G.renderOpts.collectedTags;if(!P)return await (0,p.sendResponse)(W,V,o,G.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,_.toNodeOutgoingHttpHeaders)(o.headers);l&&(t[g.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==G.renderOpts.collectedRevalidate&&!(G.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&G.renderOpts.collectedRevalidate,n=void 0===G.renderOpts.collectedExpire||G.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:G.renderOpts.collectedExpire;return{value:{kind:k.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await $.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:x})},!1,S),t}},u=await $.handleResponse({req:e,nextConfig:R,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:x,revalidateOnlyGenerated:N,responseGenerator:l,waitUntil:n.waitUntil,isMinimalMode:K});if(!P)return null;if((null==u||null==(o=u.value)?void 0:o.kind)!==k.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(s=u.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",x?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,_.fromNodeOutgoingHttpHeaders)(u.value.headers);return K&&P||d.delete(g.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,h.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(W,V,new Response(u.value.body,{headers:d,status:u.value.status||200})),null};F&&B?await s(B):(a=M.getActiveScopeSpan(),await M.withPropagatedContext(e.headers,()=>M.trace(d.BaseServerSpan.handleRequest,{spanName:`${U} ${w}`,kind:o.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},s),void 0,!F))}catch(t){if(t instanceof f.NoFallbackError||await $.onRequestError(e,t,{routerKind:"App Router",routePath:T,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:x})},!1,S),P)throw t;return await (0,p.sendResponse)(W,V,new Response(null,{status:500})),null}}e.s(["handler",0,x,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:C})},"routeModule",0,$,"serverHooks",0,S,"workAsyncStorage",0,E,"workUnitAsyncStorage",0,C],58670)}];

//# sourceMappingURL=_0a3lsd~._.js.map