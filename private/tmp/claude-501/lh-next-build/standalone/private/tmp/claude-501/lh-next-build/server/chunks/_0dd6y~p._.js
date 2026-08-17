module.exports=[67698,e=>{"use strict";var t=e.i(43793),n=e.i(63424),a=e.i(75601);let r=e=>e&&e.length?e:null;async function i(e,i){let o=i??await (0,a.getCurrentGuest)();if(!o)return null;let s=e.startsWith("nb-bk-")?e:`nb-bk-${e}`,l=await (0,n.getBookingById)(s);if(!l)return null;let u=l.newbook_booking_id??String(s).replace("nb-bk-",""),d=r(l.check_in),c=r(l.check_out),p=l.details??{},_=p.signature_status??null,g=p.signature_signed_at??null,h=p.signature_document_url??null,b=JSON.stringify(p),R=await t.sql`
    select id from bookings where newbook_booking_id = ${u} limit 1
  `;return R.length>0?(await t.sql`
      update bookings set
        guest_id = ${o.id},
        property_id = ${o.property_id},
        status = ${l.status},
        check_in = ${d},
        check_out = ${c},
        site_or_room = ${l.site_or_room},
        booking_type = ${l.booking_type},
        total_amount = ${l.total_amount},
        balance_due = ${l.balance_due},
        signature_status = ${_},
        signature_signed_at = ${g},
        signature_document_url = ${h},
        details = ${b}::jsonb,
        synced_at = now()
      where id = ${R[0].id}
      returning id, property_id, guest_id, newbook_booking_id,
        check_in, check_out, site_or_room, status, balance_due
    `)[0]:(await t.sql`
    insert into bookings (
      property_id, guest_id, newbook_booking_id, status, check_in, check_out,
      site_or_room, booking_type, total_amount, balance_due,
      signature_status, signature_signed_at, signature_document_url,
      details, synced_at
    ) values (
      ${o.property_id}, ${o.id}, ${u}, ${l.status}, ${d}, ${c},
      ${l.site_or_room}, ${l.booking_type}, ${l.total_amount}, ${l.balance_due},
      ${_}, ${g}, ${h},
      ${b}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `)[0]}e.s(["ensureBookingSynced",0,i])},7041,e=>{"use strict";var t=e.i(47909),n=e.i(74017),a=e.i(96250),r=e.i(59756),i=e.i(61916),o=e.i(74677),s=e.i(69741),l=e.i(16795),u=e.i(87718),d=e.i(95169),c=e.i(47587),p=e.i(66012),_=e.i(70101),g=e.i(26937),h=e.i(10372),b=e.i(93695);e.i(52474);var R=e.i(220),m=e.i(89171),w=e.i(43793),y=e.i(75601),k=e.i(67698);async function v(e,{params:t}){try{let n=await (0,y.requireGuest)(),{id:a}=await t,r=await e.json().catch(()=>({})),i=await (0,k.ensureBookingSynced)(a,n);if(!i||i.guest_id!==n.id)return m.NextResponse.json({data:null,error:"Booking not found"},{status:404});let o="string"==typeof r.reason&&r.reason.trim().length?r.reason.trim():null,s=await w.sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, details
      )
      values (
        ${i.id}, ${n.id}, ${i.property_id}, null, 'cancellation',
        1, 0, 'pending', 'waived',
        ${JSON.stringify({request_type:"cancellation",reason:o,site_or_room:i.site_or_room,check_in:i.check_in,check_out:i.check_out})}::jsonb
      )
      returning *
    `;await w.sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${i.property_id}, 'admin', ${i.property_id},
        'Cancellation requested',
        ${`Guest requested to cancel ${i.site_or_room??"their booking"}.${o?` Reason: ${o}`:""}`},
        'push'
      )
    `;let l={request_id:s[0].id,booking_id:a,status:"pending",message:"Cancellation requested — the front desk will confirm your cancellation shortly."};return m.NextResponse.json({data:l,error:null},{status:201})}catch(n){let e=n instanceof Error?n.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("POST /api/bookings/[id]/cancel error:",n),m.NextResponse.json({data:null,error:e},{status:t})}}e.s(["POST",0,v],21588);var f=e.i(21588);let $=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/bookings/[id]/cancel/route",pathname:"/api/bookings/[id]/cancel",filename:"route",bundlePath:""},distDir:"/private/tmp/claude-501/lh-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/bookings/[id]/cancel/route.ts",nextConfigOutput:"standalone",userland:f,...{}}),{workAsyncStorage:E,workUnitAsyncStorage:C,serverHooks:x}=$;async function q(e,t,a){a.requestMeta&&(0,r.setRequestMeta)(e,a.requestMeta),$.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let m="/api/bookings/[id]/cancel/route";m=m.replace(/\/index$/,"")||"/";let w=await $.prepare(e,t,{srcPage:m,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:y,params:k,nextConfig:v,parsedUrl:f,isDraftMode:E,prerenderManifest:C,routerServerContext:x,isOnDemandRevalidate:q,revalidateOnlyGenerated:A,resolvedPathname:N,clientReferenceManifest:S,serverActionsManifest:T}=w,P=(0,s.normalizeAppPath)(m),O=!!(C.dynamicRoutes[P]||C.routes[N]),I=async()=>((null==x?void 0:x.render404)?await x.render404(e,t,f,!1):t.end("This page could not be found"),null);if(O&&!E){let e=!!C.routes[N],t=C.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(v.adapterPath)return await I();throw new b.NoFallbackError}}let H=null;!O||$.isDev||E||(H="/index"===(H=N)?"/":H);let U=!0===$.isDev||!O,M=O&&!U;T&&S&&(0,o.setManifestsSingleton)({page:m,clientReferenceManifest:S,serverActionsManifest:T});let j=e.method||"GET",D=(0,i.getTracer)(),B=D.getActiveScopeSpan(),F=!!(null==x?void 0:x.isWrappedByNextServer),K=!!(0,r.getRequestMeta)(e,"minimalMode"),G=(0,r.getRequestMeta)(e,"incrementalCache")||await $.getIncrementalCache(e,v,C,K);null==G||G.resetRequestCache(),globalThis.__incrementalCache=G;let L={params:k,previewProps:C.preview,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:U,incrementalCache:G,cacheLifeProfiles:v.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,a,r)=>$.onRequestError(e,t,a,r,x)},sharedContext:{buildId:y}},W=new l.NodeNextRequest(e),V=new l.NodeNextResponse(t),X=u.NextRequestAdapter.fromNodeNextRequest(W,(0,u.signalFromNodeResponse)(t));try{let r,o=async e=>$.handle(X,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=D.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=n.get("next.route");if(a){let t=`${j} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t),r&&r!==e&&(r.setAttribute("http.route",a),r.updateName(t))}else e.updateName(`${j} ${m}`)}),s=async r=>{var i,s;let l=async({previousCacheEntry:n})=>{try{if(!K&&q&&A&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await o(r);e.fetchMetrics=L.renderOpts.fetchMetrics;let s=L.renderOpts.pendingWaitUntil;s&&a.waitUntil&&(a.waitUntil(s),s=void 0);let l=L.renderOpts.collectedTags;if(!O)return await (0,p.sendResponse)(W,V,i,L.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,_.toNodeOutgoingHttpHeaders)(i.headers);l&&(t[h.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,a=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:a}}}}catch(t){throw(null==n?void 0:n.isStale)&&await $.onRequestError(e,t,{routerKind:"App Router",routePath:m,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:q})},!1,x),t}},u=await $.handleResponse({req:e,nextConfig:v,cacheKey:H,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:q,revalidateOnlyGenerated:A,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:K});if(!O)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(s=u.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",q?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,_.fromNodeOutgoingHttpHeaders)(u.value.headers);return K&&O||d.delete(h.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,g.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(W,V,new Response(u.value.body,{headers:d,status:u.value.status||200})),null};F&&B?await s(B):(r=D.getActiveScopeSpan(),await D.withPropagatedContext(e.headers,()=>D.trace(d.BaseServerSpan.handleRequest,{spanName:`${j} ${m}`,kind:i.SpanKind.SERVER,attributes:{"http.method":j,"http.target":e.url}},s),void 0,!F))}catch(t){if(t instanceof b.NoFallbackError||await $.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:q})},!1,x),O)throw t;return await (0,p.sendResponse)(W,V,new Response(null,{status:500})),null}}e.s(["handler",0,q,"patchFetch",0,function(){return(0,a.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:C})},"routeModule",0,$,"serverHooks",0,x,"workAsyncStorage",0,E,"workUnitAsyncStorage",0,C],7041)}];

//# sourceMappingURL=_0dd6y~p._.js.map