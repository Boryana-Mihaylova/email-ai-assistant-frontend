export type EmailItem = {
  id: number;
  subject?: string;
  from?: string;
  content: string;
  summary: string;
  urgency: string;
  intent?: string;
  reason: string;
  actions?: string[];
};

export type SentItem = {
  email_id: number;
  intent: string;
  draft: string;
  status: string;
  sent_at: string;
};

export type FollowUp = {
  normal_emails_count: number;
  suggested_time: string;
  message: string;
};
