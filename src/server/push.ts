import { createHash } from "node:crypto";
import { eq, like } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/server/db";
import { appSettings } from "@/server/db/schema";
import { deleteSetting, setSetting } from "@/server/settings";
import { logError } from "@/server/log";

const PREFIX = "push_sub:";

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

const subscriptionKey = (userId: number, endpoint: string) =>
  `${PREFIX}${userId}:${createHash("sha256").update(endpoint).digest("hex").slice(0, 16)}`;

export function isPushConfigured(): boolean {
  return Boolean(process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:contato@igrejacentral.local", publicKey, privateKey);
  return true;
}

export async function savePushSubscription(userId: number, subscription: PushSubscriptionData): Promise<void> {
  await setSetting(subscriptionKey(userId, subscription.endpoint), JSON.stringify({ userId, subscription }));
}

export async function removePushSubscription(userId: number, endpoint: string): Promise<void> {
  await deleteSetting(subscriptionKey(userId, endpoint));
}

export async function hasPushSubscription(userId: number, endpoint: string): Promise<boolean> {
  const rows = await db.select({ key: appSettings.key }).from(appSettings).where(eq(appSettings.key, subscriptionKey(userId, endpoint)));
  return rows.length > 0;
}

interface StoredSubscription {
  userId: number;
  subscription: PushSubscriptionData;
}

export async function sendPush(userIds: number[], payload: PushPayload): Promise<number> {
  if (userIds.length === 0 || !configure()) return 0;
  const wanted = new Set(userIds);
  const rows = await db.select({ key: appSettings.key, value: appSettings.value }).from(appSettings).where(like(appSettings.key, `${PREFIX}%`));

  let sent = 0;
  for (const row of rows) {
    let stored: StoredSubscription;
    try {
      stored = JSON.parse(row.value) as StoredSubscription;
    } catch {
      continue;
    }
    if (!wanted.has(stored.userId)) continue;
    try {
      await webpush.sendNotification(stored.subscription, JSON.stringify(payload));
      sent += 1;
    } catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await deleteSetting(row.key);
      else logError("push: envio falhou", error);
    }
  }
  return sent;
}
