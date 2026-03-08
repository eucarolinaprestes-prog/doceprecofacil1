import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Lock, Mail, Sun, Moon, Eye, EyeOff, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AccountSettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada com sucesso! 🔒" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: err.message || "Erro ao alterar senha", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ title: "Digite um e-mail válido", variant: "destructive" });
      return;
    }
    setSavingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: "Um link de confirmação foi enviado para o novo e-mail! 📧" });
      setNewEmail("");
    } catch (err: any) {
      toast({ title: err.message || "Erro ao alterar e-mail", variant: "destructive" });
    } finally {
      setSavingEmail(false);
    }
  };

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg">
          <Settings className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências ⚙️</p>
      </div>

      {/* Current email display */}
      <Card className="card-elevated">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground mb-1">E-mail atual</p>
          <p className="text-sm font-bold text-foreground">{user?.email}</p>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="card-elevated">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Alterar Senha
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 rounded-xl pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirmar nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl pr-12"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword}
              className="w-full rounded-xl h-12 font-bold"
            >
              {savingPassword ? "Salvando..." : "Alterar Senha"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Email */}
      <Card className="card-elevated">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Alterar E-mail
          </h3>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Novo e-mail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Button
              onClick={handleChangeEmail}
              disabled={savingEmail || !newEmail}
              className="w-full rounded-xl h-12 font-bold"
            >
              {savingEmail ? "Salvando..." : "Alterar E-mail"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="card-elevated">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
            Aparência
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className="w-5 h-5 text-warning" />
              <span className="text-sm font-medium text-foreground">Modo Escuro</span>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="card-elevated">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-base font-extrabold text-foreground">🔔 Notificações</h3>
          {[
            { label: "Lembretes de encomendas", icon: "📦" },
            { label: "Lembretes de produção", icon: "👩‍🍳" },
            { label: "Alertas de estoque baixo", icon: "⚠️" },
            { label: "Resumo semanal", icon: "📊" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{item.icon} {item.label}</span>
              <Switch />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="destructive"
        onClick={handleLogout}
        className="w-full rounded-xl h-14 font-bold text-base gap-2"
      >
        <LogOut className="w-5 h-5" /> Sair da Conta
      </Button>
    </div>
  );
};

export default AccountSettings;
