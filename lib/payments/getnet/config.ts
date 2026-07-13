export function isGetnetConfigured(): boolean {
  return Boolean(
    process.env.GETNET_API_BASE_URL &&
      process.env.GETNET_CLIENT_ID &&
      process.env.GETNET_CLIENT_SECRET &&
      process.env.GETNET_SELLER_ID
  );
}

export function getGetnetConfig() {
  return {
    baseUrl: process.env.GETNET_API_BASE_URL ?? "",
    clientId: process.env.GETNET_CLIENT_ID ?? "",
    clientSecret: process.env.GETNET_CLIENT_SECRET ?? "",
    sellerId: process.env.GETNET_SELLER_ID ?? "",
    webhookSecret: process.env.GETNET_WEBHOOK_SECRET ?? "",
  };
}
