import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  name: string;
  store_name: string | null;
  address: string | null;
  whatsapp: string | null;
  logo_url: string | null;
  desired_salary: number | null;
  work_days_per_week: number | null;
  work_hours_per_day: number | null;
  business_id: string | null;
}

type AppRole = "owner" | "staff";

interface Subscription {
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  businessId: string | null;
  role: AppRole | null;
  isOwner: boolean;
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from("assinaturas" as any)
      .select("plano, status, data_inicio, data_expiracao")
      .eq("id_usuario", userId)
      .order("data_inicio", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setSubscription(data as any);
    } else {
      setSubscription(null);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("name, store_name, address, whatsapp, logo_url, desired_salary, work_days_per_week, work_hours_per_day, business_id")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile(data as Profile);
      if (data.business_id) {
        setBusinessId(data.business_id);
      }
    }

    // Fetch role
    const { data: roleData } = await (supabase.from("user_roles") as any)
      .select("role, business_id")
      .eq("user_id", userId)
      .limit(1)
      .single();
    if (roleData) {
      setRole(roleData.role as AppRole);
      if (!data?.business_id && roleData.business_id) {
        setBusinessId(roleData.business_id);
      }
    }

    // Fetch subscription
    await fetchSubscription(userId);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setBusinessId(null);
          setRole(null);
          setSubscription(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setBusinessId(null);
    setRole(null);
    setSubscription(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const isOwner = role === "owner";

  const hasActiveSubscription = !!(
    subscription &&
    subscription.status === "ativo" &&
    new Date(subscription.data_expiracao) > new Date()
  );

  return (
    <AuthContext.Provider value={{ user, profile, session, isAuthenticated: !!session, isLoading, businessId, role, isOwner, subscription, hasActiveSubscription, signUp, signIn, signOut, resetPassword, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
