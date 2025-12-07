/* export const environment = {
  production: false,
  apiUrl: 'http://localhost:5037/api',
  apiUrlForImages: 'http://localhost:5037',
  appName: 'Manisik Umrah Booking Platform',
  version: '1.0.0',
  // Stripe configuration (publishable key for client-side)
  stripe: {
    publishableKey: 'pk_test_51SXi6ADI8RwYwJs03fV0jNsfKfnYv3OSAhocTnzCqfWx3PFSHRPRKbPDuvkUplrfFTs4uaeD6NMZRdbkxvqIGR9k00BleztKHR',
    currency: 'USD'
  }
};
 */

export const environment = {
  production: false,
  apiUrl: 'http://localhost:5037/api',
  apiUrlForImages: 'http://localhost:5037',
  appName: 'Manisik Umrah Booking Platform',
  version: '1.0.0',
  stripe: {
    publishableKey: 'pk_test_51SXi6ADI8RwYwJs03fV0jNsfKfnYv3OSAhocTnzCqfWx3PFSHRPRKbPDuvkUplrfFTs4uaeD6NMZRdbkxvqIGR9k00BleztKHR',
    currency: 'usd',
    successPath: '/booking-confirmation',
    cancelPath: '/booking-cancellation',
  },
};