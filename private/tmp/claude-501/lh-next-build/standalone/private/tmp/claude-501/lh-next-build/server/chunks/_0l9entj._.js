module.exports=[67698,e=>{"use strict";var t=e.i(43793),a=e.i(63424),r=e.i(75601);let n=e=>e&&e.length?e:null;async function o(e,o){let i=o??await (0,r.getCurrentGuest)();if(!i)return null;let s=e.startsWith("nb-bk-")?e:`nb-bk-${e}`,d=await (0,a.getBookingById)(s);if(!d)return null;let l=d.newbook_booking_id??String(s).replace("nb-bk-",""),u=n(d.check_in),c=n(d.check_out),p=d.details??{},_=p.signature_status??null,g=p.signature_signed_at??null,h=p.signature_document_url??null,y=JSON.stringify(p),b=await t.sql`
    select id from bookings where newbook_booking_id = ${l} limit 1
  `;return b.length>0?(await t.sql`
      update bookings set
        guest_id = ${i.id},
        property_id = ${i.property_id},
        status = ${d.status},
        check_in = ${u},
        check_out = ${c},
        site_or_room = ${d.site_or_room},
        booking_type = ${d.booking_type},
        total_amount = ${d.total_amount},
        balance_due = ${d.balance_due},
        signature_status = ${_},
        signature_signed_at = ${g},
        signature_document_url = ${h},
        details = ${y}::jsonb,
        synced_at = now()
      where id = ${b[0].id}
      returning id, property_id, guest_id, newbook_booking_id,
        check_in, check_out, site_or_room, status, balance_due
    `)[0]:(await t.sql`
    insert into bookings (
      property_id, guest_id, newbook_booking_id, status, check_in, check_out,
      site_or_room, booking_type, total_amount, balance_due,
      signature_status, signature_signed_at, signature_document_url,
      details, synced_at
    ) values (
      ${i.property_id}, ${i.id}, ${l}, ${d.status}, ${u}, ${c},
      ${d.site_or_room}, ${d.booking_type}, ${d.total_amount}, ${d.balance_due},
      ${_}, ${g}, ${h},
      ${y}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `)[0]}e.s(["ensureBookingSynced",0,o])},8100,e=>{"use strict";var t=e.i(47909),a=e.i(74017),r=e.i(96250),n=e.i(59756),o=e.i(61916),i=e.i(74677),s=e.i(69741),d=e.i(16795),l=e.i(87718),u=e.i(95169),c=e.i(47587),p=e.i(66012),_=e.i(70101),g=e.i(26937),h=e.i(10372),y=e.i(93695);e.i(52474);var b=e.i(220),v=e.i(89171),m=e.i(43793),f=e.i(75601),w=e.i(67698);async function R(e,{params:t}){try{let e=await (0,f.requireGuest)(),{id:a}=await t,r=await (0,w.ensureBookingSynced)(a,e);if(!r)return v.NextResponse.json({data:null,error:"Booking not found"},{status:404});let[n,o]=await Promise.all([m.sql`
        select * from addon_catalog
        where property_id = ${r.property_id} and active = true
        order by sort_order asc
      `,m.sql`
        select
          r.*,
          c.id as c_id, c.slug as c_slug, c.name as c_name, c.category as c_category,
          c.price_cents as c_price_cents, c.requires_approval as c_requires_approval
        from addon_requests r
        left join addon_catalog c on c.id = r.addon_catalog_id
        where r.booking_id = ${r.id}
        order by r.requested_at desc
      `]),i=o.map(e=>({id:e.id,booking_id:e.booking_id,guest_id:e.guest_id,property_id:e.property_id,addon_catalog_id:e.addon_catalog_id,addon_type:e.addon_type,quantity:e.quantity,price_cents:e.price_cents,status:e.status,payment_status:e.payment_status,paid_at:e.paid_at,scheduled_for:e.scheduled_for,staff_notes:e.staff_notes,resolved_by:e.resolved_by,details:e.details??{},requested_at:e.requested_at,resolved_at:e.resolved_at,addon_catalog:e.c_id?{id:e.c_id,slug:e.c_slug,name:e.c_name,category:e.c_category,price_cents:e.c_price_cents,requires_approval:e.c_requires_approval}:null}));return v.NextResponse.json({data:{catalog:n,requests:i},error:null},{status:200})}catch(a){let e=a instanceof Error?a.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("GET /api/bookings/[id]/addons error:",a),v.NextResponse.json({data:null,error:e},{status:t})}}async function $(e,{params:t}){try{let a=await (0,f.requireGuest)(),{id:r}=await t,n=await e.json();if(!n.addon_catalog_id)return v.NextResponse.json({data:null,error:"addon_catalog_id is required"},{status:400});let o=Math.max(1,Math.floor(n.quantity??1)),i=await (0,w.ensureBookingSynced)(r,a);if(!i||i.guest_id!==a.id)return v.NextResponse.json({data:null,error:"Booking not found"},{status:404});let s=await m.sql`
      select id, property_id, slug, name, price_cents, requires_approval, active
      from addon_catalog
      where id = ${n.addon_catalog_id}
      limit 1
    `;if(0===s.length||s[0].property_id!==i.property_id)return v.NextResponse.json({data:null,error:"Add-on not available for this property"},{status:404});let d=s[0];if(!d.active)return v.NextResponse.json({data:null,error:"Add-on is not currently available"},{status:400});let l=d.price_cents*o,u=d.requires_approval||0!==l?"pending":"auto_approved",c=await m.sql`
      insert into addon_requests (
        booking_id, guest_id, property_id, addon_catalog_id, addon_type,
        quantity, price_cents, status, payment_status, details
      )
      values (
        ${i.id}, ${a.id}, ${i.property_id}, ${d.id}, ${d.slug},
        ${o}, ${l}, ${u},
        ${0===l?"waived":"unpaid"},
        ${JSON.stringify(n.details??{})}::jsonb
      )
      returning *
    `,p=l>0?`Total $${(l/100).toFixed(2)}.`:"";return await m.sql`
      insert into notifications (property_id, target_type, target_id, title, body, channel)
      values (
        ${i.property_id}, 'admin', ${i.property_id},
        ${`Add-on requested: ${d.name}`},
        ${`Quantity ${o}. ${p}`.trim()},
        'push'
      )
    `,v.NextResponse.json({data:c[0],error:null},{status:201})}catch(a){let e=a instanceof Error?a.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("POST /api/bookings/[id]/addons error:",a),v.NextResponse.json({data:null,error:e},{status:t})}}e.s(["GET",0,R,"POST",0,$],22386);var k=e.i(22386);let q=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/bookings/[id]/addons/route",pathname:"/api/bookings/[id]/addons",filename:"route",bundlePath:""},distDir:"/private/tmp/claude-501/lh-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/bookings/[id]/addons/route.ts",nextConfigOutput:"standalone",userland:k,...{}}),{workAsyncStorage:E,workUnitAsyncStorage:x,serverHooks:C}=q;async function N(e,t,r){r.requestMeta&&(0,n.setRequestMeta)(e,r.requestMeta),q.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/bookings/[id]/addons/route";v=v.replace(/\/index$/,"")||"/";let m=await q.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!m)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:f,params:w,nextConfig:R,parsedUrl:$,isDraftMode:k,prerenderManifest:E,routerServerContext:x,isOnDemandRevalidate:C,revalidateOnlyGenerated:N,resolvedPathname:A,clientReferenceManifest:S,serverActionsManifest:T}=m,P=(0,s.normalizeAppPath)(v),O=!!(E.dynamicRoutes[P]||E.routes[A]),j=async()=>((null==x?void 0:x.render404)?await x.render404(e,t,$,!1):t.end("This page could not be found"),null);if(O&&!k){let e=!!E.routes[A],t=E.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(R.adapterPath)return await j();throw new y.NoFallbackError}}let I=null;!O||q.isDev||k||(I="/index"===(I=A)?"/":I);let U=!0===q.isDev||!O,H=O&&!U;T&&S&&(0,i.setManifestsSingleton)({page:v,clientReferenceManifest:S,serverActionsManifest:T});let M=e.method||"GET",B=(0,o.getTracer)(),D=B.getActiveScopeSpan(),F=!!(null==x?void 0:x.isWrappedByNextServer),G=!!(0,n.getRequestMeta)(e,"minimalMode"),K=(0,n.getRequestMeta)(e,"incrementalCache")||await q.getIncrementalCache(e,R,E,G);null==K||K.resetRequestCache(),globalThis.__incrementalCache=K;let L={params:w,previewProps:E.preview,renderOpts:{experimental:{authInterrupts:!!R.experimental.authInterrupts},cacheComponents:!!R.cacheComponents,supportsDynamicResponse:U,incrementalCache:K,cacheLifeProfiles:R.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,r,n)=>q.onRequestError(e,t,r,n,x)},sharedContext:{buildId:f}},W=new d.NodeNextRequest(e),z=new d.NodeNextResponse(t),V=l.NextRequestAdapter.fromNodeNextRequest(W,(0,l.signalFromNodeResponse)(t));try{let n,i=async e=>q.handle(V,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=B.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=a.get("next.route");if(r){let t=`${M} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",r),n.updateName(t))}else e.updateName(`${M} ${v}`)}),s=async n=>{var o,s;let d=async({previousCacheEntry:a})=>{try{if(!G&&C&&N&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(n);e.fetchMetrics=L.renderOpts.fetchMetrics;let s=L.renderOpts.pendingWaitUntil;s&&r.waitUntil&&(r.waitUntil(s),s=void 0);let d=L.renderOpts.collectedTags;if(!O)return await (0,p.sendResponse)(W,z,o,L.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,_.toNodeOutgoingHttpHeaders)(o.headers);d&&(t[h.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,r=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:b.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:r}}}}catch(t){throw(null==a?void 0:a.isStale)&&await q.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:C})},!1,x),t}},l=await q.handleResponse({req:e,nextConfig:R,cacheKey:I,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:E,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:N,responseGenerator:d,waitUntil:r.waitUntil,isMinimalMode:G});if(!O)return null;if((null==l||null==(o=l.value)?void 0:o.kind)!==b.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(s=l.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});G||t.setHeader("x-nextjs-cache",C?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),k&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,_.fromNodeOutgoingHttpHeaders)(l.value.headers);return G&&O||u.delete(h.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,g.getCacheControlHeader)(l.cacheControl)),await (0,p.sendResponse)(W,z,new Response(l.value.body,{headers:u,status:l.value.status||200})),null};F&&D?await s(D):(n=B.getActiveScopeSpan(),await B.withPropagatedContext(e.headers,()=>B.trace(u.BaseServerSpan.handleRequest,{spanName:`${M} ${v}`,kind:o.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},s),void 0,!F))}catch(t){if(t instanceof y.NoFallbackError||await q.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:C})},!1,x),O)throw t;return await (0,p.sendResponse)(W,z,new Response(null,{status:500})),null}}e.s(["handler",0,N,"patchFetch",0,function(){return(0,r.patchFetch)({workAsyncStorage:E,workUnitAsyncStorage:x})},"routeModule",0,q,"serverHooks",0,C,"workAsyncStorage",0,E,"workUnitAsyncStorage",0,x],8100)}];

//# sourceMappingURL=_0l9entj._.js.map