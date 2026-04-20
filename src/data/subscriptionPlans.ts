export interface PlanOption {
  name: string;
  value: string;
}

export const FEED_PLAN_FIELD_ID = 360029461773;
export const CHAT_PLAN_FIELD_ID = 360029461913;
export const VIDEO_PLAN_FIELD_ID = 21856738993559;

export const FEED_PLAN_OPTIONS: PlanOption[] = [
  { name: "No plan",               value: "no_plan" },
  { name: "Feed Free",             value: "feeds_free" },
  { name: "Maker Plan - Feeds",    value: "maker_feeds" },
  { name: "Feed Start",            value: "feeds_start" },
  { name: "Feed Startup",          value: "feeds_startup" },
  { name: "Feed Standard",         value: "feeds_standard" },
  { name: "Feed Premium",          value: "feeds_premium" },
  { name: "Feed Elevate",          value: "feeds_elevate" },
  { name: "Feed Enterprise",       value: "feeds_enterprise" },
];

export const CHAT_PLAN_OPTIONS: PlanOption[] = [
  { name: "No Plan",               value: "no_chat" },
  { name: "Trial (expired)",       value: "trial_expired" },
  { name: "Build - Free",          value: "chat_free" },
  { name: "Maker/Free Plan",       value: "maker_chat" },
  { name: "Startup",               value: "chat_startup" },
  { name: "Standard",              value: "chat_standard" },
  { name: "Premium",               value: "chat_premium" },
  { name: "10K MAU",               value: "chat_10k_mau" },
  { name: "25K MAU",               value: "chat_25k_mau" },
  { name: "50K MAU",               value: "chat_50k_mau" },
  { name: "Enterprise",            value: "chat_enterprise" },
  { name: "Pre-Sales Enterprise",  value: "pre-sales_enterprise" },
];

export const VIDEO_PLAN_OPTIONS: PlanOption[] = [
  { name: "Bucket Plan",           value: "video_bucket" },
  { name: "Bucket Plan Enterprise",value: "bucket_plan_enterprise" },
  { name: "Build - Free",          value: "video_non_enterprise" },
  { name: "Pay as you go",         value: "video_pay_as_you_go" },
  { name: "Pre-Sales",             value: "video_pre_sales" },
  { name: "Enterprise",            value: "video_enterprise" },
];
