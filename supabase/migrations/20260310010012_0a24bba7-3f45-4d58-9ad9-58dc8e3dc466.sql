
CREATE TABLE public.assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_usuario UUID NOT NULL,
  plano TEXT NOT NULL DEFAULT 'prata',
  status TEXT NOT NULL DEFAULT 'ativo',
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON public.assinaturas
FOR SELECT
TO authenticated
USING (id_usuario = auth.uid());

CREATE POLICY "System can insert subscriptions"
ON public.assinaturas
FOR INSERT
TO authenticated
WITH CHECK (id_usuario = auth.uid());
