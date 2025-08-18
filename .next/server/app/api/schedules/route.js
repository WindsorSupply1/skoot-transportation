"use strict";(()=>{var e={};e.id=4109,e.ids=[4109],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},33342:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>y,requestAsyncStorage:()=>l,routeModule:()=>p,serverHooks:()=>m,staticGenerationAsyncStorage:()=>h});var s={};r.r(s),r.d(s,{GET:()=>c,dynamic:()=>n});var a=r(49303),i=r(88716),o=r(60670),u=r(87070),d=r(20728);let n="force-dynamic";async function c(e){try{let{searchParams:t}=new URL(e.url),r=t.get("routeId"),s=`
      SELECT 
        s.id,
        s."routeId",
        s."dayOfWeek",
        s.time,
        s."isActive",
        r.id as route_id,
        r.name as route_name,
        r.origin as route_origin,
        r.destination as route_destination,
        r.duration as route_duration
      FROM schedules s
      INNER JOIN routes r ON s."routeId" = r.id
      WHERE s."isActive" = true AND r."isActive" = true
    `;r&&(s+=` AND s."routeId" = '${r}'`),s+=" ORDER BY r.name, s.time";let a=await d._.$queryRawUnsafe(s),i=new Date,o=new Date;o.setDate(o.getDate()+30);let n=await d._.departure.findMany({where:{date:{gte:i,lte:o},status:{in:["SCHEDULED","BOARDING"]}},select:{id:!0,scheduleId:!0,date:!0,capacity:!0,bookedSeats:!0,status:!0}}),c={};n.forEach(e=>{c[e.scheduleId]||(c[e.scheduleId]=[]),c[e.scheduleId].push({id:e.id,date:e.date,capacity:e.capacity,bookedSeats:e.bookedSeats,availableSeats:e.capacity-e.bookedSeats,status:e.status})});let p=a.map(e=>({id:e.id,time:e.time,dayOfWeek:e.dayOfWeek,capacity:20,isActive:e.isActive,route:{id:e.route_id,name:e.route_name,origin:e.route_origin,destination:e.route_destination,duration:e.route_duration},upcomingDepartures:c[e.id]||[]}));return u.NextResponse.json({schedules:p,count:a.length})}catch(e){return console.error("Schedules fetch error:",e),u.NextResponse.json({error:"Failed to fetch schedules",schedules:[]},{status:500})}}let p=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/schedules/route",pathname:"/api/schedules",filename:"route",bundlePath:"app/api/schedules/route"},resolvedPagePath:"C:\\Users\\priej\\skoot-transportation\\src\\app\\api\\schedules\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:l,staticGenerationAsyncStorage:h,serverHooks:m}=p,g="/api/schedules/route";function y(){return(0,o.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:h})}},20728:(e,t,r)=>{r.d(t,{_:()=>a});let s=require("@prisma/client"),a=globalThis.prisma??new s.PrismaClient}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,5972],()=>r(33342));module.exports=s})();