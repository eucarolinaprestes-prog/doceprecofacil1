import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Bell, CreditCard, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Configurações</h1>

      <Tabs defaultValue="account">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Conta</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full rounded-xl justify-start">Alterar senha</Button>
              <Button variant="outline" className="w-full rounded-xl justify-start">Alterar e-mail</Button>
              <Button variant="outline" className="w-full rounded-xl justify-start">Alterar imagem</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> Assinatura</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Você ainda não possui um plano ativo.</p>
              <Button className="rounded-xl">Ver planos</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Alertas de encomendas</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Lembretes de entrega</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Resumo semanal</span>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
