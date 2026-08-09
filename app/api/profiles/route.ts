import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
    const rawIds = new URL(req.url).searchParams.get("ids") || "";
    const ids = Array.from(new Set(rawIds.split(",").filter((id) => UUID_PATTERN.test(id)))).slice(0, 100);

    if (ids.length === 0) return NextResponse.json({ ok: true, data: [] });

    const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ids);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data: data || [] });
}
