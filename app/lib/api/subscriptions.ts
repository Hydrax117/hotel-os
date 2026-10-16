import { apiClient } from './client';

export type InitializePaymentResponse = {
  authorizationUrl: string;
  reference: string;
};

export type SubscriptionResponse = {
  id: string;
  plan: string;
  status: string;
};

export function initializeSubscriptionPayment(
  hotelId: string,
  plan: string,
): Promise<InitializePaymentResponse> {
  return apiClient.post<InitializePaymentResponse>(
    `/api/v1/subscriptions/hotels/${hotelId}/initialize`,
    { plan },
  );
}

export function verifySubscriptionPayment(
  hotelId: string,
  reference: string,
): Promise<SubscriptionResponse> {
  return apiClient.post<SubscriptionResponse>(
    `/api/v1/subscriptions/hotels/${hotelId}/verify`,
    { reference },
  );
}
