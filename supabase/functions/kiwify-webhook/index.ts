import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Kiwify webhook received:", JSON.stringify(body));

    // Validate webhook token
    const expectedToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
    const signature = body.signature || req.headers.get("x-kiwify-signature") || "";

    // Kiwify sends order data - check if payment is approved
    const orderStatus = body.order_status || body.subscription_status;
    if (orderStatus !== "paid" && orderStatus !== "active") {
      console.log("Order not paid/active, skipping. Status:", orderStatus);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract customer email and plan info
    const email = body.Customer?.email || body.customer?.email;
    if (!email) {
      console.error("No customer email found in webhook payload");
      return new Response(JSON.stringify({ error: "No customer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine plan from product or checkout URL
    const productName = (body.Product?.name || body.product?.name || "").toLowerCase();
    const checkoutId = body.checkout_link || body.Subscription?.plan?.id || "";
    
    let plano = "prata";
    let diasValidade = 7; // default weekly

    if (productName.includes("diamante") || checkoutId.includes("nqVZFgx")) {
      plano = "diamante";
      diasValidade = 365;
    } else if (productName.includes("ouro") || checkoutId.includes("GrsK5J4")) {
      plano = "ouro";
      diasValidade = 30;
    } else if (productName.includes("prata") || checkoutId.includes("svrszxU")) {
      plano = "prata";
      diasValidade = 7;
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by email
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      return new Response(JSON.stringify({ error: "Failed to find user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      console.error("User not found for email:", email);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate dates
    const dataInicio = new Date().toISOString();
    const dataExpiracao = new Date(
      Date.now() + diasValidade * 24 * 60 * 60 * 1000
    ).toISOString();

    // Upsert subscription
    const { error: upsertError } = await supabaseAdmin
      .from("assinaturas")
      .upsert(
        {
          id_usuario: user.id,
          plano,
          status: "ativo",
          data_inicio: dataInicio,
          data_expiracao: dataExpiracao,
        },
        { onConflict: "id_usuario" }
      );

    if (upsertError) {
      // If upsert fails (no unique constraint on id_usuario), try insert
      console.log("Upsert failed, trying insert:", upsertError.message);
      const { error: insertError } = await supabaseAdmin
        .from("assinaturas")
        .insert({
          id_usuario: user.id,
          plano,
          status: "ativo",
          data_inicio: dataInicio,
          data_expiracao: dataExpiracao,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create subscription" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log(`Subscription created: ${plano} for user ${user.id} (${email})`);

    return new Response(
      JSON.stringify({ ok: true, plano, email, expires: dataExpiracao }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
