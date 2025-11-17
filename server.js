const express = require('express');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static('public'));

// ---- ROUTES ----
app.get('/success', (req, res) => {
  res.sendFile(__dirname + '/public/success.html');
});

app.get('/cancel', (req, res) => {
  res.sendFile(__dirname + '/public/cancel.html');
});

// ---- CHECKOUT SESSION ----
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, recurring } = req.body;
    console.log('Received donation request:', { amount, recurring });

    // FIX: Always produce a valid absolute URL
    const baseUrl =
      process.env.RENDER_EXTERNAL_URL ||        // Render deployment URL (auto-set by Render)
      process.env.DOMAIN ||                    // Optional: If you set DOMAIN manually
      'http://localhost:5000';                 // Local fallback

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: recurring ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Masjid Donation' },
            unit_amount: amount,
            recurring: recurring ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
    });

    console.log('Stripe session created:', session.id);
    res.json({ url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---- SERVER ----
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));
