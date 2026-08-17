module.exports=[67698,e=>{"use strict";var t=e.i(43793),n=e.i(63424),r=e.i(75601);let o=e=>e&&e.length?e:null;async function a(e,a){let i=a??await (0,r.getCurrentGuest)();if(!i)return null;let s=e.startsWith("nb-bk-")?e:`nb-bk-${e}`,u=await (0,n.getBookingById)(s);if(!u)return null;let l=u.newbook_booking_id??String(s).replace("nb-bk-",""),d=o(u.check_in),c=o(u.check_out),p=u.details??{},_=p.signature_status??null,g=p.signature_signed_at??null,h=p.signature_document_url??null,f=JSON.stringify(p),m=await t.sql`
    select id from bookings where newbook_booking_id = ${l} limit 1
  `;return m.length>0?(await t.sql`
      update bookings set
        guest_id = ${i.id},
        property_id = ${i.property_id},
        status = ${u.status},
        check_in = ${d},
        check_out = ${c},
        site_or_room = ${u.site_or_room},
        booking_type = ${u.booking_type},
        total_amount = ${u.total_amount},
        balance_due = ${u.balance_due},
        signature_status = ${_},
        signature_signed_at = ${g},
        signature_document_url = ${h},
        details = ${f}::jsonb,
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
      ${i.property_id}, ${i.id}, ${l}, ${u.status}, ${d}, ${c},
      ${u.site_or_room}, ${u.booking_type}, ${u.total_amount}, ${u.balance_due},
      ${_}, ${g}, ${h},
      ${f}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `)[0]}e.s(["ensureBookingSynced",0,a])},64382,38220,74321,9730,e=>{"use strict";let t=Symbol.for("constructDateFrom");function n(e,n){return"function"==typeof e?e(n):e&&"object"==typeof e&&t in e?e[t](n):e instanceof Date?new e.constructor(n):new Date(n)}function r(e,t){return n(t||e,e)}function o(e){let t=r(e),n=new Date(Date.UTC(t.getFullYear(),t.getMonth(),t.getDate(),t.getHours(),t.getMinutes(),t.getSeconds(),t.getMilliseconds()));return n.setUTCFullYear(t.getFullYear()),e-n}function a(e,t){let n=r(e,t?.in);return n.setHours(0,0,0,0),n}e.s(["constructFromSymbol",0,t,"millisecondsInDay",0,864e5,"millisecondsInHour",0,36e5,"millisecondsInMinute",0,6e4,"millisecondsInWeek",0,6048e5],38220),e.s(["constructFrom",0,n],74321),e.s(["toDate",0,r],9730),e.s(["differenceInCalendarDays",0,function(e,t,r){let[i,s]=function(e,...t){let r=n.bind(null,e||t.find(e=>"object"==typeof e));return t.map(r)}(r?.in,e,t),u=a(i),l=a(s);return Math.round((u-o(u)-(l-o(l)))/864e5)}],64382)},48439,e=>{"use strict";var t=e.i(47909),n=e.i(74017),r=e.i(96250),o=e.i(59756),a=e.i(61916),i=e.i(74677),s=e.i(69741),u=e.i(16795),l=e.i(87718),d=e.i(95169),c=e.i(47587),p=e.i(66012),_=e.i(70101),g=e.i(26937),h=e.i(10372),f=e.i(93695);e.i(52474);var m=e.i(220),y=e.i(89171),w=e.i(64382),b=e.i(43793),k=e.i(75601),v=e.i(67698);async function R(e,{params:t}){try{let n=await (0,k.requireGuest)(),{id:r}=await t,o=await e.json();if(!o.new_check_out)return y.NextResponse.json({data:null,error:"new_check_out date is required"},{status:400});let a=new Date(o.new_check_out);if(isNaN(a.getTime()))return y.NextResponse.json({data:null,error:"Invalid new_check_out date"},{status:400});let i=await (0,v.ensureBookingSynced)(r,n);if(!i||i.guest_id!==n.id)return y.NextResponse.json({data:null,error:"Booking not found"},{status:404});if(!i.check_out)return y.NextResponse.json({data:null,error:"Booking has no check-out date to extend"},{status:400});let s=new Date(i.check_out);if(a<=s)return y.NextResponse.json({data:null,error:"new_check_out must be after current check-out"},{status:400});let u=await b.sql`
      select id, slug, name, price_cents, requires_approval, active
      from addon_catalog
      where property_id = ${i.property_id} and slug = 'stay_extension'
      limit 1
    `;if(0===u.length||!u[0].active)return y.NextResponse.json({data:null,error:"Stay extension is not offered for this property"},{status:400});let l=u[0],d=!1;i.site_or_room&&(d=(await b.sql`
        select id, check_in from bookings
        where property_id = ${i.property_id}
          and site_or_room = ${i.site_or_room}
          and id <> ${i.id}
          and check_in >= ${s.toISOString()}
          and check_in < ${a.toISOString()}
          and status = any(${["confirmed","upcoming","checked_in"]})
      `).length>0);let c=Math.max(1,(0,w.differenceInCalendarDays)(a,s)),p=l.price_cents*c,_=d||l.requires_approval?"pending":"auto_approved",g={has_conflict:d,requires_room_move:d,original_check_out:i.check_out,extra_nights:c},h=await b.sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, scheduled_for, details
      )
      values (
        ${i.id}, ${n.id}, ${i.property_id}, ${l.id}, ${l.slug},
        ${c}, ${p}, ${_},
        ${0===p?"waived":"unpaid"},
        ${a.toISOString()},
        ${JSON.stringify(g)}::jsonb
      )
      returning *
    `;return await b.sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${i.property_id}, 'admin', ${i.property_id},
        ${d?"Stay extension requested (conflict — may need room move)":"Stay extension auto-approved"},
        ${`+${c} night(s) on ${i.site_or_room??"n/a"} to ${a.toISOString().slice(0,10)}`},
        'push'
      )
    `,y.NextResponse.json({data:h[0],error:null},{status:201})}catch(n){let e=n instanceof Error?n.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("POST /api/bookings/[id]/extend error:",n),y.NextResponse.json({data:null,error:e},{status:t})}}e.s(["POST",0,R],85687);var $=e.i(85687);let x=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/bookings/[id]/extend/route",pathname:"/api/bookings/[id]/extend",filename:"route",bundlePath:""},distDir:"/private/tmp/claude-501/lh-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/bookings/[id]/extend/route.ts",nextConfigOutput:"standalone",userland:$,...{}}),{workAsyncStorage:S,workUnitAsyncStorage:C,serverHooks:E}=x;async function N(e,t,r){r.requestMeta&&(0,o.setRequestMeta)(e,r.requestMeta),x.isDev&&(0,o.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/bookings/[id]/extend/route";y=y.replace(/\/index$/,"")||"/";let w=await x.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:b,params:k,nextConfig:v,parsedUrl:R,isDraftMode:$,prerenderManifest:S,routerServerContext:C,isOnDemandRevalidate:E,revalidateOnlyGenerated:N,resolvedPathname:q,clientReferenceManifest:A,serverActionsManifest:T}=w,I=(0,s.normalizeAppPath)(y),O=!!(S.dynamicRoutes[I]||S.routes[q]),P=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,R,!1):t.end("This page could not be found"),null);if(O&&!$){let e=!!S.routes[q],t=S.dynamicRoutes[I];if(t&&!1===t.fallback&&!e){if(v.adapterPath)return await P();throw new f.NoFallbackError}}let D=null;!O||x.isDev||$||(D="/index"===(D=q)?"/":D);let j=!0===x.isDev||!O,M=O&&!j;T&&A&&(0,i.setManifestsSingleton)({page:y,clientReferenceManifest:A,serverActionsManifest:T});let H=e.method||"GET",U=(0,a.getTracer)(),F=U.getActiveScopeSpan(),B=!!(null==C?void 0:C.isWrappedByNextServer),K=!!(0,o.getRequestMeta)(e,"minimalMode"),G=(0,o.getRequestMeta)(e,"incrementalCache")||await x.getIncrementalCache(e,v,S,K);null==G||G.resetRequestCache(),globalThis.__incrementalCache=G;let L={params:k,previewProps:S.preview,renderOpts:{experimental:{authInterrupts:!!v.experimental.authInterrupts},cacheComponents:!!v.cacheComponents,supportsDynamicResponse:j,incrementalCache:G,cacheLifeProfiles:v.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,o)=>x.onRequestError(e,t,r,o,C)},sharedContext:{buildId:b}},W=new u.NodeNextRequest(e),V=new u.NodeNextResponse(t),X=l.NextRequestAdapter.fromNodeNextRequest(W,(0,l.signalFromNodeResponse)(t));try{let o,i=async e=>x.handle(X,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=U.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${H} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),o&&o!==e&&(o.setAttribute("http.route",r),o.updateName(t))}else e.updateName(`${H} ${y}`)}),s=async o=>{var a,s;let u=async({previousCacheEntry:n})=>{try{if(!K&&E&&N&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await i(o);e.fetchMetrics=L.renderOpts.fetchMetrics;let s=L.renderOpts.pendingWaitUntil;s&&r.waitUntil&&(r.waitUntil(s),s=void 0);let u=L.renderOpts.collectedTags;if(!O)return await (0,p.sendResponse)(W,V,a,L.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,_.toNodeOutgoingHttpHeaders)(a.headers);u&&(t[h.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,r=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:m.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await x.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:E})},!1,C),t}},l=await x.handleResponse({req:e,nextConfig:v,cacheKey:D,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:E,revalidateOnlyGenerated:N,responseGenerator:u,waitUntil:r.waitUntil,isMinimalMode:K});if(!O)return null;if((null==l||null==(a=l.value)?void 0:a.kind)!==m.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(s=l.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});K||t.setHeader("x-nextjs-cache",E?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),$&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let d=(0,_.fromNodeOutgoingHttpHeaders)(l.value.headers);return K&&O||d.delete(h.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||t.getHeader("Cache-Control")||d.get("Cache-Control")||d.set("Cache-Control",(0,g.getCacheControlHeader)(l.cacheControl)),await (0,p.sendResponse)(W,V,new Response(l.value.body,{headers:d,status:l.value.status||200})),null};B&&F?await s(F):(o=U.getActiveScopeSpan(),await U.withPropagatedContext(e.headers,()=>U.trace(d.BaseServerSpan.handleRequest,{spanName:`${H} ${y}`,kind:a.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},s),void 0,!B))}catch(t){if(t instanceof f.NoFallbackError||await x.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:E})},!1,C),O)throw t;return await (0,p.sendResponse)(W,V,new Response(null,{status:500})),null}}e.s(["handler",0,N,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:S,workUnitAsyncStorage:C})},"routeModule",0,x,"serverHooks",0,E,"workAsyncStorage",0,S,"workUnitAsyncStorage",0,C],48439)}];

//# sourceMappingURL=_0o2e47l._.js.map