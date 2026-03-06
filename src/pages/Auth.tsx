import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";

const PasswordInput = ({ value, onChange, placeholder = "••••••••", ...props }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-12 rounded-xl pr-12"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

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
    <div className="min-h-screen flex items-center justify-center gradient-bg px-4">
      <Card className="w-full max-w-md card-elevated border-border/40">
        <CardHeader className="text-center space-y-4 pb-2">
          <img src={logo} alt="Doce Preço Fácil" className="mx-auto w-32 h-32 object-contain drop-shadow-lg" />
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-4 rounded-xl h-12">
              <TabsTrigger value="login" className="rounded-lg text-sm font-semibold">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg text-sm font-semibold">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <p className="text-center text-lg font-bold text-foreground mb-4">Bem-vinda de volta! 💕</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Senha</label>
                  <PasswordInput value={password} onChange={(e: any) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold btn-3d" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-center pt-2">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">Esqueci minha senha</Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <p className="text-center text-lg font-bold text-foreground mb-4">Bem-vinda ao Doce Preço Fácil! 🧁</p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Nome</label>
                  <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">E-mail</label>
                  <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Senha</label>
                  <PasswordInput value={password} onChange={(e: any) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Confirmar senha</label>
                  <PasswordInput value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold btn-3d" disabled={loading}>
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
