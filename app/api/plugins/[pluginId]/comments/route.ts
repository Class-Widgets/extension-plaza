import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function createRequestSupabase(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
  try {
    const { pluginId } = await ctx.params;
    const requestSupabase = createRequestSupabase(req) ?? supabase;

    const { data: ratings, error } = await requestSupabase
      .schema('cw')
      .from('cw_plugins_rating')
      .select('plugin_id, user_id, rating, created_at, updated_at, cw_plugin_rating_comments(content, status, review_comment, created_at, updated_at, reviewed_at, reviewed_by)')
      .eq('plugin_id', pluginId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((ratings ?? []).map((rating) => rating.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
      : { data: [], error: null };

    if (profilesError) {
      return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
    }

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const data = (ratings ?? []).map((rating) => {
      const comment = Array.isArray(rating.cw_plugin_rating_comments)
        ? rating.cw_plugin_rating_comments[0] ?? null
        : rating.cw_plugin_rating_comments;

      return {
        plugin_id: rating.plugin_id,
        user_id: rating.user_id,
        rating: rating.rating,
        created_at: rating.created_at,
        updated_at: rating.updated_at,
        comment: comment?.content ?? null,
        comment_status: comment?.status ?? null,
        review_comment: comment?.review_comment ?? null,
        comment_created_at: comment?.created_at ?? null,
        comment_updated_at: comment?.updated_at ?? null,
        profile: profileMap.get(rating.user_id) ?? null,
      };
    });

    return NextResponse.json({ ok: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ pluginId: string }> }) {
  try {
    const { pluginId } = await ctx.params;
    const requestSupabase = createRequestSupabase(req);

    const payload = await req.json().catch(() => ({}));
    const rating = Number(payload?.rating ?? 5);
    const comment = String(payload?.comment ?? '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: '评分必须在 1 到 5 之间' }, { status: 400 });
    }

    if (comment.length > 64) {
      return NextResponse.json({ ok: false, error: '评论不能超过 64 个字符' }, { status: 400 });
    }

    const authorization = req.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user || !requestSupabase) {
      return NextResponse.json({ ok: false, error: '请先登录后再评论' }, { status: 401 });
    }

    const { data: commentStatus, error } = await requestSupabase.schema('cw').rpc('submit_plugin_rating_comment', {
      p_plugin_id: pluginId,
      p_rating: rating,
      p_content: comment || null,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: {
        comment_status: commentStatus,
        message: commentStatus === 'pending' ? '评论已提交，审核通过后公开显示。' : null,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
