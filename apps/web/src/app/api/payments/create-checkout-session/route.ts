import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  const user = session?.user;
  if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { profile_type, plan_tier } = body;

  if (!profile_type || !['comprador', 'vendedor', 'hibrido'].includes(profile_type)) {
    return Response.json({ error: 'Tipo de perfil inválido' }, { status: 400 });
  }

  const prices: Record<string, number> = {
    bronze: 50000,
    silver: 180000,
    gold: 300000,
  };
  const price = prices[plan_tier || 'bronze'];

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-06-30.basil' });
  const origin =
    req.headers.get('origin') || process.env.NEXT_PUBLIC_CREATE_APP_URL || 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: { name: `Plano ${plan_tier} - ${profile_type}` },
          unit_amount: price,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard?payment=success`,
    cancel_url: `${origin}/subscription-plans?payment=cancelled`,
    metadata: { user_id: user.id, profile_type, plan_tier },
  });

  return Response.json({ url: checkoutSession.url });
}
