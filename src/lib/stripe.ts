import Stripe from "stripe";

export const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

export const stripe = STRIPE_ENABLED
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-06-20" })
  : null;

export const PRICE_ONE_TIME = process.env.STRIPE_PRICE_ID_ONE_TIME ?? "";
export const PRICE_STORAGE_SUBSCRIPTION = process.env.STRIPE_PRICE_ID_STORAGE_SUBSCRIPTION ?? "";
