import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify webhook signature (you'll need to set STRIPE_WEBHOOK_SECRET)
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      logStep("Webhook signature verification failed", err);
      return new Response("Webhook signature verification failed", { status: 400 });
    }

    logStep("Processing webhook event", { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription' && session.metadata?.user_id) {
          logStep("Processing successful subscription checkout", { sessionId: session.id });
          
          const userId = session.metadata.user_id;
          const newPlan = session.metadata.new_plan as 'pro' | 'elite';
          const billingCycle = session.metadata.billing_cycle || 'monthly';
          const previousPlan = session.metadata.previous_plan || 'starter';
          const prorataAmount = parseInt(session.metadata.prorata_amount || '0');

          // Get the subscription from Stripe
          if (session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            // Update subscription in database
            const subscriptionData = {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              current_plan: newPlan,
              previous_plan: previousPlan,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              billing_cycle_anchor: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
              updated_at: new Date().toISOString()
            };

            const { error: subError } = await supabaseAdmin
              .from('subscriptions')
              .upsert(subscriptionData, { onConflict: 'user_id' });

            if (subError) {
              logStep("Error updating subscription", subError);
            } else {
              logStep("Subscription updated successfully", { userId, newPlan });
            }

            // Create billing event
            const { data: subRecord } = await supabaseAdmin
              .from('subscriptions')
              .select('id')
              .eq('user_id', userId)
              .single();

            await supabaseAdmin
              .from('billing_events')
              .insert({
                user_id: userId,
                subscription_id: subRecord?.id,
                event_type: 'upgrade_completed',
                from_plan: previousPlan,
                to_plan: newPlan,
                prorata_amount_cents: prorataAmount,
                full_amount_cents: session.amount_total || 0,
                stripe_payment_intent_id: session.payment_intent as string,
                billing_reason: `Successful upgrade from ${previousPlan} to ${newPlan}`,
                metadata: {
                  stripe_session_id: session.id,
                  stripe_subscription_id: subscription.id,
                  billing_cycle: billingCycle
                }
              });

            logStep("Billing event recorded");

            // Record paid_started analytics event (server-side, webhook-truthful)
            const sessionId = `webhook_${session.id}`;
            await supabaseAdmin
              .from('product_events')
              .insert({
                user_id: userId,
                session_id: sessionId,
                event_name: 'paid_started',
                event_props: {
                  plan: newPlan,
                  billing_cycle: billingCycle,
                  amount_cents: session.amount_total || 0,
                  stripe_session_id: session.id,
                  source: 'stripe_webhook',
                },
              });

            logStep("paid_started analytics event recorded", { userId, plan: newPlan });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          logStep("Processing successful payment", { invoiceId: invoice.id });
          
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customerId = subscription.customer as string;
          
          // Find user by customer ID
          const { data: subRecord } = await supabaseAdmin
            .from('subscriptions')
            .select('user_id, id, current_plan')
            .eq('stripe_customer_id', customerId)
            .single();

          if (subRecord) {
            // Record payment event
            await supabaseAdmin
              .from('billing_events')
              .insert({
                user_id: subRecord.user_id,
                subscription_id: subRecord.id,
                event_type: 'payment',
                to_plan: subRecord.current_plan,
                full_amount_cents: invoice.amount_paid,
                stripe_invoice_id: invoice.id,
                billing_reason: 'Recurring subscription payment',
                metadata: {
                  invoice_number: invoice.number,
                  period_start: new Date(invoice.period_start * 1000).toISOString(),
                  period_end: new Date(invoice.period_end * 1000).toISOString()
                }
              });

            logStep("Payment recorded", { userId: subRecord.user_id, amount: invoice.amount_paid });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        logStep("Processing subscription update", { subscriptionId: subscription.id });
        
        // Update subscription status in database
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          logStep("Error updating subscription status", updateError);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        logStep("Processing subscription cancellation", { subscriptionId: subscription.id });
        
        // Update subscription to cancelled and downgrade to starter
        const { data: subRecord, error: fetchError } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id, id, current_plan')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (!fetchError && subRecord) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              previous_plan: subRecord.current_plan,
              current_plan: 'starter',
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);

          // Record cancellation event
          await supabaseAdmin
            .from('billing_events')
            .insert({
              user_id: subRecord.user_id,
              subscription_id: subRecord.id,
              event_type: 'cancel',
              from_plan: subRecord.current_plan,
              to_plan: 'starter',
              billing_reason: 'Subscription cancelled',
              metadata: {
                cancelled_at: new Date().toISOString(),
                stripe_subscription_id: subscription.id
              }
            });

          logStep("Subscription cancelled and user downgraded", { userId: subRecord.user_id });
        }
        break;
      }

      default:
        logStep("Unhandled webhook event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});