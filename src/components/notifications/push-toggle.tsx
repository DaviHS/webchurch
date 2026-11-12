"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=").replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export function PushToggle() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    void currentSubscription().then((subscription) => {
      setSupported(isSupported);
      setEndpoint(subscription?.endpoint ?? null);
    });
  }, []);

  const status = api.notification.status.useQuery({ endpoint }, { enabled: supported === true });
  const subscribe = api.notification.subscribe.useMutation();
  const unsubscribe = api.notification.unsubscribe.useMutation();
  const sendTest = api.notification.sendTest.useMutation();
  const utils = api.useUtils();

  if (supported === null) return null;
  if (!supported) {
    return <p className="text-xs text-muted-foreground">Este navegador não aceita notificações. No iPhone, adicione o app à tela inicial primeiro.</p>;
  }
  if (status.data && !status.data.configured) {
    return <p className="text-xs text-muted-foreground">As notificações ainda não foram configuradas no servidor.</p>;
  }

  const active = Boolean(status.data?.subscribed);

  async function turnOn() {
    setBusy(true);
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        toast.error("Permissão negada. Libere as notificações nas configurações do navegador.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUBLIC_KEY) }));
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Inscrição incompleta");
      await subscribe.mutateAsync({ subscription: { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } } });
      setEndpoint(json.endpoint);
      await utils.notification.status.invalidate();
      await sendTest.mutateAsync();
      toast.success("Notificações ativadas neste aparelho");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível ativar as notificações");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await unsubscribe.mutateAsync({ endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setEndpoint(null);
      await utils.notification.status.invalidate();
      toast.success("Notificações desativadas neste aparelho");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível desativar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">Avisar no celular</p>
        <p className="text-xs text-muted-foreground">
          {active ? "Você recebe o aviso dos aniversariantes do dia neste aparelho." : "Receba o aviso dos aniversariantes do dia."}
        </p>
      </div>
      <Button type="button" size="sm" variant={active ? "outline" : "default"} disabled={busy || status.isLoading} onClick={() => void (active ? turnOff() : turnOn())}>
        {active ? <BellOff /> : <Bell />}
        {active ? "Desativar" : "Ativar"}
      </Button>
    </div>
  );
}
