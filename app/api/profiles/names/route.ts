import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
    const payload = await req.json().catch(() => ({}));
    const ids = Array.isArray(payload?.ids)
        ? Array.from(new Set(payload.ids.map(String).filter((id: string) => UUID_PATTERN.test(id))))
        : [];

    if (ids.length === 0) {
        return NextResponse.json({ ok: true, data: [] });
    }
    if (ids.length > 500) {
        return NextResponse.json({ ok: false, error: "一次最多查询 500 个用户" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: data ?? [] });
}
