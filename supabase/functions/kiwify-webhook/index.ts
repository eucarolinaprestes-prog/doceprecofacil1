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
    // Validate webhook token
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const expectedToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");

    if (!token || token !== expectedToken) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Kiwify webhook received:", JSON.stringify(body));

    // Kiwify sends order data with status
    const orderStatus = body.order_status;
    const customerEmail = body.Customer?.email;

    if (!customerEmail) {
      console.error("No customer email in webhook payload");
      return new Response(JSON.stringify({ error: "Missing customer email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process paid/approved orders
    if (orderStatus !== "paid" && orderStatus !== "approved") {
      console.log(`Order status "${orderStatus}" - ignoring`);
      return new Response(JSON.stringify({ ok: true, message: "Ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine plan from product/amount
    const productName = (body.Product?.name || "").toLowerCase();
    const amount = body.Commissions?.charge_amount || body.order_value || 0;

    let plano = "prata";
    let diasValidade = 7; // default weekly

    if (productName.includes("diamante") || amount >= 9700) {
      plano = "diamante";
      diasValidade = 365;
    } else if (productName.includes("ouro") || amount >= 2700) {
      plano = "ouro";
      diasValidade = 30;
    } else {
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
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.users.find(
      (u: any) => u.email?.toLowerCase() === customerEmail.toLowerCase()
    );

    if (!user) {
      console.error(`User not found for email: ${customerEmail}`);
      return new Response(
        JSON.stringify({ error: "User not found", email: customerEmail }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const expiration = new Date(now);
    expiration.setDate(expiration.getDate() + diasValidade);

    // Insert subscription
    const { error: insertError } = await supabaseAdmin
      .from("assinaturas")
      .insert({
        id_usuario: user.id,
        plano,
        status: "ativo",
        data_inicio: now.toISOString(),
        data_expiracao: expiration.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting subscription:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `Subscription created: ${plano} for ${customerEmail} until ${expiration.toISOString()}`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        plano,
        expiration: expiration.toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
