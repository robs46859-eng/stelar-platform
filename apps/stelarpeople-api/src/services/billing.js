const StripeService = require('../../../../packages/stripe-core');

// Initialize with env var from Key Vault
const billing = new StripeService(process.env.STRIPE_SECRET_KEY);

module.exports = billing;
