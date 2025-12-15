export const environment = {
  production: true,
  apiUrl: 'https://manisik.runasp.net/api',
  apiUrlForImages: 'https://manisik.runasp.net',
  appName: 'Manisik Umrah Booking Platform',
  version: '1.0.0',
  stripe: {
    publishableKey: 'pk_test_51SXi6ADI8RwYwJs03fV0jNsfKfnYv3OSAhocTnzCqfWx3PFSHRPRKbPDuvkUplrfFTs4uaeD6NMZRdbkxvqIGR9k00BleztKHR',
    currency: 'SAR',
    successPath: '/booking-confirmation',
    cancelPath: '/booking-cancellation',
  }
};
