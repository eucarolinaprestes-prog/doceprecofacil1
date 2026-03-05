import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Auth = () => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch {
      toast({ title: "Erro ao entrar", description: "Verifique suas credenciais.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Senhas não conferem", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar." });
      setTab("login");
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center space-y-3 pb-2">
          <img src={logo} alt="Doce Preço Fácil" className="mx-auto w-24 h-24 object-contain" />
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <p className="text-center text-lg font-semibold text-foreground mb-4">Bem-vinda de volta!</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-center pt-2">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">Esqueci minha senha</Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <p className="text-center text-lg font-semibold text-foreground mb-4">Bem-vinda ao Doce Preço Fácil</p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome</label>
                  <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                  <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
