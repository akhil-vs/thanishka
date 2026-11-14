export type FeedbackStatusValue =
  | "NEW"
  | "REVIEWED"
  | "PUBLISHED"
  | "HIDDEN";

export type SerializedFeedback = {
  id: string;
  orderId: string;
  orderNumber: string | null;
  userId: string | null;
  rating: number;
  message: string;
  displayName: string;
  place: string | null;
  status: FeedbackStatusValue;
  createdAt: string;
};

export type PublicTestimonial = {
  id: string;
  quote: string;
  name: string;
  place: string;
  rating: number;
};
