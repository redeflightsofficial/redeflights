export type EnquiryStatus = "new" | "read" | "replied";

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  status: EnquiryStatus;
  created_at: string;
};

export type ContactFormPayload = {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
};
