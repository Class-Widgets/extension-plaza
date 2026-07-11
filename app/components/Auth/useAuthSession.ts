"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthSession {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

// 跟踪 Supabase 登录状态的客户端 hook
export function useAuthSession(): AuthSession {
    const [session, setSession] = React.useState<Session | null>(null);
    const [loading, setLoading] = React.useState(true);

    // 稳定 user 引用：只有当实际用户 ID 变化时才变化，避免 TOKEN_REFRESHED 事件导致重渲染
    const user = React.useMemo(() => session?.user ?? null, [session?.user?.id]);

    React.useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session);
            setLoading(false);
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setLoading(false);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    const signOut = React.useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    return {
        session,
        user,
        loading,
        signOut,
    };
}
