module.exports=[67698,e=>{"use strict";var t=e.i(43793),r=e.i(63424),i=e.i(75601);let n=e=>e&&e.length?e:null;async function a(e,a){let o=a??await (0,i.getCurrentGuest)();if(!o)return null;let s=e.startsWith("nb-bk-")?e:`nb-bk-${e}`,l=await (0,r.getBookingById)(s);if(!l)return null;let d=l.newbook_booking_id??String(s).replace("nb-bk-",""),u=n(l.check_in),_=n(l.check_out),c=l.details??{},p=c.signature_status??null,g=c.signature_signed_at??null,b=c.signature_document_url??null,h=JSON.stringify(c),f=await t.sql`
    select id from bookings where newbook_booking_id = ${d} limit 1
  `;return f.length>0?(await t.sql`
      update bookings set
        guest_id = ${o.id},
        property_id = ${o.property_id},
        status = ${l.status},
        check_in = ${u},
        check_out = ${_},
        site_or_room = ${l.site_or_room},
        booking_type = ${l.booking_type},
        total_amount = ${l.total_amount},
        balance_due = ${l.balance_due},
        signature_status = ${p},
        signature_signed_at = ${g},
        signature_document_url = ${b},
        details = ${h}::jsonb,
        synced_at = now()
      where id = ${f[0].id}
      returning id, property_id, guest_id, newbook_booking_id,
        check_in, check_out, site_or_room, status, balance_due
    `)[0]:(await t.sql`
    insert into bookings (
      property_id, guest_id, newbook_booking_id, status, check_in, check_out,
      site_or_room, booking_type, total_amount, balance_due,
      signature_status, signature_signed_at, signature_document_url,
      details, synced_at
    ) values (
      ${o.property_id}, ${o.id}, ${d}, ${l.status}, ${u}, ${_},
      ${l.site_or_room}, ${l.booking_type}, ${l.total_amount}, ${l.balance_due},
      ${p}, ${g}, ${b},
      ${h}::jsonb, now()
    )
    returning id, property_id, guest_id, newbook_booking_id,
      check_in, check_out, site_or_room, status, balance_due
  `)[0]}e.s(["ensureBookingSynced",0,a])},83584,e=>{"use strict";var t=e.i(47909),r=e.i(74017),i=e.i(96250),n=e.i(59756),a=e.i(61916),o=e.i(74677),s=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),_=e.i(47587),c=e.i(66012),p=e.i(70101),g=e.i(26937),b=e.i(10372),h=e.i(93695);e.i(52474);var f=e.i(220),k=e.i(89171),m=e.i(43793),w=e.i(75601),v=e.i(67698);async function y(){try{let e=await (0,w.getSessionUser)();if(!e)return k.NextResponse.json({data:null,error:"Unauthorized"},{status:401});let t=("admin"===e.role?await m.sql`
        select
          r.id, r.property_id, r.guest_id, r.booking_id, r.rating, r.feedback,
          r.is_public_intent, r.public_cta_url, r.public_cta_clicked,
          r.staff_response, r.staff_responded_at, r.staff_responded_by, r.created_at,
          g.id as g_id, g.first_name as g_first_name, g.last_name as g_last_name, g.email as g_email,
          b.id as b_id, b.newbook_booking_id as b_newbook_id, b.check_in as b_check_in, b.check_out as b_check_out, b.site_or_room as b_site_or_room
        from reviews r
        left join guests g on g.id = r.guest_id
        left join bookings b on b.id = r.booking_id
        order by r.created_at desc
      `:await m.sql`
        select
          r.id, r.property_id, r.guest_id, r.booking_id, r.rating, r.feedback,
          r.is_public_intent, r.public_cta_url, r.public_cta_clicked,
          r.staff_response, r.staff_responded_at, r.staff_responded_by, r.created_at,
          g.id as g_id, g.first_name as g_first_name, g.last_name as g_last_name, g.email as g_email,
          b.id as b_id, b.newbook_booking_id as b_newbook_id, b.check_in as b_check_in, b.check_out as b_check_out, b.site_or_room as b_site_or_room
        from reviews r
        left join guests g on g.id = r.guest_id
        left join bookings b on b.id = r.booking_id
        where r.guest_id in (
          select id from guests where newbook_guest_id = ${e.newbookGuestId}
        )
        order by r.created_at desc
      `).map(e=>({id:e.id,property_id:e.property_id,guest_id:e.guest_id,booking_id:e.b_newbook_id?`nb-bk-${e.b_newbook_id}`:e.booking_id,rating:e.rating,feedback:e.feedback,is_public_intent:e.is_public_intent,public_cta_url:e.public_cta_url,public_cta_clicked:e.public_cta_clicked,staff_response:e.staff_response,staff_responded_at:e.staff_responded_at,staff_responded_by:e.staff_responded_by,created_at:e.created_at,guest:e.g_id?{id:e.g_id,first_name:e.g_first_name,last_name:e.g_last_name,email:e.g_email??""}:null,booking:e.b_id&&e.b_check_in&&e.b_check_out?{id:e.b_id,check_in:e.b_check_in,check_out:e.b_check_out,site_or_room:e.b_site_or_room}:null}));return k.NextResponse.json({data:t,error:null},{status:200})}catch(e){return console.error("GET /api/reviews error:",e),k.NextResponse.json({data:null,error:"Internal server error"},{status:500})}}async function R(e){try{let t=await (0,w.requireGuest)(),r=await e.json(),i=Number(r?.rating);if(!Number.isInteger(i)||i<1||i>5)return k.NextResponse.json({data:null,error:"rating must be an integer 1-5"},{status:400});let n=!!r?.is_public_intent,a="string"==typeof r?.feedback&&r.feedback.trim().length>0?r.feedback.trim():null,o="string"==typeof r?.booking_id&&r.booking_id.length>0?r.booking_id:null,s=null;if(o){let e=await (0,v.ensureBookingSynced)(o,t);s=e?.id??null}let l=null;if(n){let e=await m.sql`
        select branding from properties where id = ${t.property_id} limit 1
      `;l=e[0]?.branding?.public_review_url??null}let d=await m.sql`
      insert into reviews (
        property_id, guest_id, booking_id, rating, feedback,
        is_public_intent, public_cta_url
      )
      values (
        ${t.property_id}, ${t.id}, ${s}, ${i}, ${a},
        ${n}, ${l}
      )
      returning *
    `;if(i<5){let e=a?a.slice(0,160):`Rating: ${i} star${1===i?"":"s"}`;await m.sql`
        insert into notifications (property_id, target_type, target_id, title, body, channel)
        values (${t.property_id}, 'admin', ${t.property_id}, 'New private feedback', ${e}, 'push')
      `}return k.NextResponse.json({data:d[0],error:null},{status:201})}catch(r){let e=r instanceof Error?r.message:"Internal server error",t="Unauthorized"===e?401:e.includes("Forbidden")?403:500;return 500===t&&console.error("POST /api/reviews error:",r),k.NextResponse.json({data:null,error:e},{status:t})}}e.s(["GET",0,y,"POST",0,R],8196);var $=e.i(8196);let E=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/reviews/route",pathname:"/api/reviews",filename:"route",bundlePath:""},distDir:"/private/tmp/claude-501/lh-next-build",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/reviews/route.ts",nextConfigOutput:"standalone",userland:$,...{}}),{workAsyncStorage:C,workUnitAsyncStorage:x,serverHooks:N}=E;async function A(e,t,i){i.requestMeta&&(0,n.setRequestMeta)(e,i.requestMeta),E.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let k="/api/reviews/route";k=k.replace(/\/index$/,"")||"/";let m=await E.prepare(e,t,{srcPage:k,multiZoneDraftMode:!1});if(!m)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:w,params:v,nextConfig:y,parsedUrl:R,isDraftMode:$,prerenderManifest:C,routerServerContext:x,isOnDemandRevalidate:N,revalidateOnlyGenerated:A,resolvedPathname:S,clientReferenceManifest:T,serverActionsManifest:q}=m,P=(0,s.normalizeAppPath)(k),O=!!(C.dynamicRoutes[P]||C.routes[S]),I=async()=>((null==x?void 0:x.render404)?await x.render404(e,t,R,!1):t.end("This page could not be found"),null);if(O&&!$){let e=!!C.routes[S],t=C.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(y.adapterPath)return await I();throw new h.NoFallbackError}}let j=null;!O||E.isDev||$||(j="/index"===(j=S)?"/":j);let U=!0===E.isDev||!O,H=O&&!U;q&&T&&(0,o.setManifestsSingleton)({page:k,clientReferenceManifest:T,serverActionsManifest:q});let M=e.method||"GET",D=(0,a.getTracer)(),B=D.getActiveScopeSpan(),F=!!(null==x?void 0:x.isWrappedByNextServer),G=!!(0,n.getRequestMeta)(e,"minimalMode"),K=(0,n.getRequestMeta)(e,"incrementalCache")||await E.getIncrementalCache(e,y,C,G);null==K||K.resetRequestCache(),globalThis.__incrementalCache=K;let L={params:v,previewProps:C.preview,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:U,incrementalCache:K,cacheLifeProfiles:y.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i,n)=>E.onRequestError(e,t,i,n,x)},sharedContext:{buildId:w}},W=new l.NodeNextRequest(e),z=new l.NodeNextResponse(t),V=d.NextRequestAdapter.fromNodeNextRequest(W,(0,d.signalFromNodeResponse)(t));try{let n,o=async e=>E.handle(V,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=D.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${M} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t),n&&n!==e&&(n.setAttribute("http.route",i),n.updateName(t))}else e.updateName(`${M} ${k}`)}),s=async n=>{var a,s;let l=async({previousCacheEntry:r})=>{try{if(!G&&N&&A&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await o(n);e.fetchMetrics=L.renderOpts.fetchMetrics;let s=L.renderOpts.pendingWaitUntil;s&&i.waitUntil&&(i.waitUntil(s),s=void 0);let l=L.renderOpts.collectedTags;if(!O)return await (0,c.sendResponse)(W,z,a,L.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,p.toNodeOutgoingHttpHeaders)(a.headers);l&&(t[b.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=b.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,i=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=b.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:k,routeType:"route",revalidateReason:(0,_.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:N})},!1,x),t}},d=await E.handleResponse({req:e,nextConfig:y,cacheKey:j,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:N,revalidateOnlyGenerated:A,responseGenerator:l,waitUntil:i.waitUntil,isMinimalMode:G});if(!O)return null;if((null==d||null==(a=d.value)?void 0:a.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(s=d.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});G||t.setHeader("x-nextjs-cache",N?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),$&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,p.fromNodeOutgoingHttpHeaders)(d.value.headers);return G&&O||u.delete(b.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,g.getCacheControlHeader)(d.cacheControl)),await (0,c.sendResponse)(W,z,new Response(d.value.body,{headers:u,status:d.value.status||200})),null};F&&B?await s(B):(n=D.getActiveScopeSpan(),await D.withPropagatedContext(e.headers,()=>D.trace(u.BaseServerSpan.handleRequest,{spanName:`${M} ${k}`,kind:a.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},s),void 0,!F))}catch(t){if(t instanceof h.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,_.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:N})},!1,x),O)throw t;return await (0,c.sendResponse)(W,z,new Response(null,{status:500})),null}}e.s(["handler",0,A,"patchFetch",0,function(){return(0,i.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:x})},"routeModule",0,E,"serverHooks",0,N,"workAsyncStorage",0,C,"workUnitAsyncStorage",0,x],83584)}];

//# sourceMappingURL=_0d52z93._.js.map