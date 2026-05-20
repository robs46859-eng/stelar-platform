const Stripe = require('stripe');

class StripeService {
  constructor(apiKey) {
    this.stripe = new Stripe(apiKey);
  }

  async createCustomer(email, name) {
    return await this.stripe.customers.create({ email, name });
  }

  async createSubscription(customerId, priceId) {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async handleWebhook(body, signature, endpointSecret) {
    return this.stripe.webhooks.constructEvent(body, signature, endpointSecret);
  }
}

module.exports = StripeService;
