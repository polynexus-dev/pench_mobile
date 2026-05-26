export type SubmitDeliveryPayload = {
  bottles_issued: number;
  bottles_returned: number;
  bottle_transactions?: Array<{
    bottle_type_id: string;
    issued: number;
    returned: number;
    broken: number;
  }>;
};

export type SubmitDeliveryResponse = {
  id: string;
  customer: string;
  customer_name: string;
  status: string;
  status_display: string;
  scheduled_delivery_date: string;
  total: string;
  items: Array<{
    id: string;
    product: string;
    product_name: string;
    quantity: number;
    unit_price: string;
    line_total: number;
  }>;
  delivery_address: string;
  latitude: number;
  longitude: number;
  expires_in_seconds: number;
};

export type SubmitUndeliveredPayload = {
  pod_image: string;
  pod_latitude: string;
  pod_longitude: string;
};

export type SubmitUndeliveredResponse = SubmitDeliveryResponse;