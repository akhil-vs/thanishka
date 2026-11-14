export type SerializedOrderItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shipping: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
  };
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  total: number;
  couponCode: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  stockReserved?: boolean;
  items: SerializedOrderItem[];
};
