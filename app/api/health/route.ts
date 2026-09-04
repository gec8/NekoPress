import { NextResponse } from "next/server";
export async function GET(){ return NextResponse.json({ ok:true, service:"NekoPress", time:new Date().toISOString() }); }
