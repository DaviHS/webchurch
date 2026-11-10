"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Plus, Save, Settings, Trash2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/loading-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { mutationFeedback } from "@/lib/mutation-feedback";
import { siteSettingsSchema, type SiteSettings } from "@/lib/site-settings";
import { toastError } from "@/lib/toast";
import { useUploadThing } from "@/lib/uploadthing";
import { api } from "@/trpc/react";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const utils = api.useUtils();
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState<{ id: string; file: File; preview: string }[]>([]);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved) || pending.length > 0;
  const fileInput = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading: uploading } = useUploadThing("galleryImage", {
    onUploadError: (error) => {
      toastError(error.message);
    },
  });

  const save = api.site.update.useMutation(
    mutationFeedback({
      success: "Configurações salvas",
      error: "Erro ao salvar as configurações",
      onSuccess: () => utils.site.get.invalidate(),
    }),
  );

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setForm((current) => ({ ...current, [key]: value }));

  const updateAt = <K extends "services" | "history" | "aboutCards">(key: K, index: number, patch: Partial<SiteSettings[K][number]>) =>
    set(key, form[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) as SiteSettings[K]);

  const discardPending = () => {
    for (const item of pending) URL.revokeObjectURL(item.preview);
    setPending([]);
  };

  const handleCancel = () => {
    discardPending();
    setForm(saved);
  };

  const handleSave = async () => {
    const parsed = siteSettingsSchema.safeParse(form);
    if (!parsed.success) {
      toastError(parsed.error.issues[0]?.message ?? "Confira os campos");
      return;
    }

    let data = parsed.data;
    if (pending.length > 0) {
      const uploaded = await startUpload(pending.map((item) => item.file));
      if (!uploaded) return;
      const withPhotos = siteSettingsSchema.safeParse({
        ...data,
        galleryImages: [...data.galleryImages, ...uploaded.map((file) => file.serverData.url)],
      });
      if (!withPhotos.success) {
        toastError(withPhotos.error.issues[0]?.message ?? "Confira os campos");
        return;
      }
      data = withPhotos.data;
    }

    save.mutate(data, {
      onSuccess: () => {
        discardPending();
        setSaved(data);
        setForm(data);
      },
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Configurações"
        icon={Settings}
        description="Textos e contatos que aparecem na página inicial pública da igreja."
      />

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="services">Cultos</TabsTrigger>
          <TabsTrigger value="history">História</TabsTrigger>
          <TabsTrigger value="contact">Contato e fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Identidade e topo da página</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da igreja">
                <Input value={form.name} maxLength={80} onChange={(event) => set("name", event.target.value)} />
              </Field>
              <Field label="Lema" hint="Aparece no rodapé.">
                <Input value={form.tagline} maxLength={120} onChange={(event) => set("tagline", event.target.value)} />
              </Field>
              <Field label="Título de boas-vindas">
                <Input value={form.heroTitle} maxLength={120} onChange={(event) => set("heroTitle", event.target.value)} />
              </Field>
              <Field label="Frase abaixo do título">
                <Input value={form.heroSubtitle} maxLength={160} onChange={(event) => set("heroSubtitle", event.target.value)} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sobre a igreja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Apresentação">
                <Textarea rows={3} value={form.aboutIntro} maxLength={600} onChange={(event) => set("aboutIntro", event.target.value)} />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                {form.aboutCards.map((card, index) => (
                  <div key={index} className="space-y-2 rounded-md border p-3">
                    <Input
                      aria-label={`Título do destaque ${index + 1}`}
                      value={card.title}
                      maxLength={60}
                      onChange={(event) => updateAt("aboutCards", index, { title: event.target.value })}
                    />
                    <Textarea
                      aria-label={`Texto do destaque ${index + 1}`}
                      rows={4}
                      value={card.text}
                      maxLength={400}
                      onChange={(event) => updateAt("aboutCards", index, { text: event.target.value })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Cada culto vira um cartão na página e entra na lista de horários do rodapé. Sem nenhum culto, a seção some.
          </p>
          {form.services.map((service, index) => (
            <Card key={index}>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-base">{service.title || `Culto ${index + 1}`}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${service.title || "culto"}`}
                  onClick={() => set("services", form.services.filter((_, i) => i !== index))}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Field label="Nome">
                  <Input value={service.title} maxLength={80} onChange={(event) => updateAt("services", index, { title: event.target.value })} />
                </Field>
                <Field label="Dia">
                  <Input value={service.day} maxLength={60} onChange={(event) => updateAt("services", index, { day: event.target.value })} />
                </Field>
                <Field label="Horário">
                  <Input value={service.time} maxLength={40} onChange={(event) => updateAt("services", index, { time: event.target.value })} />
                </Field>
                <div className="sm:col-span-3">
                  <Field label="Local">
                    <Input value={service.place} maxLength={160} onChange={(event) => updateAt("services", index, { place: event.target.value })} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Descrição">
                    <Textarea
                      rows={3}
                      value={service.description}
                      maxLength={400}
                      onChange={(event) => updateAt("services", index, { description: event.target.value })}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          ))}
          {form.services.length < 8 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => set("services", [...form.services, { title: "", day: "", time: "", place: form.street, description: "" }])}
            >
              <Plus className="mr-1" /> Adicionar culto
            </Button>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Field label="Apresentação da história">
                <Textarea rows={2} value={form.historyIntro} maxLength={400} onChange={(event) => set("historyIntro", event.target.value)} />
              </Field>
            </CardContent>
          </Card>
          {form.history.map((item, index) => (
            <Card key={index}>
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-base">{item.title || `Capítulo ${index + 1}`}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${item.title || "capítulo"}`}
                  onClick={() => set("history", form.history.filter((_, i) => i !== index))}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Título">
                  <Input value={item.title} maxLength={60} onChange={(event) => updateAt("history", index, { title: event.target.value })} />
                </Field>
                <Field label="Texto">
                  <Textarea rows={4} value={item.text} maxLength={1200} onChange={(event) => updateAt("history", index, { text: event.target.value })} />
                </Field>
              </CardContent>
            </Card>
          ))}
          {form.history.length < 6 && (
            <Button type="button" variant="outline" onClick={() => set("history", [...form.history, { title: "", text: "" }])}>
              <Plus className="mr-1" /> Adicionar capítulo
            </Button>
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
              <CardDescription>O que for preenchido aparece na seção Entre em Contato e no rodapé.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Rua e número">
                <Input value={form.street} maxLength={160} onChange={(event) => set("street", event.target.value)} />
              </Field>
              <Field label="Cidade, estado e CEP">
                <Input value={form.city} maxLength={160} onChange={(event) => set("city", event.target.value)} />
              </Field>
              <Field label="WhatsApp" hint="Com DDD. Cria o botão “Falar no WhatsApp”.">
                <Input value={form.whatsapp} maxLength={30} inputMode="tel" placeholder="(11) 91234-5678" onChange={(event) => set("whatsapp", event.target.value)} />
              </Field>
              <Field label="E-mail">
                <Input type="email" value={form.email} maxLength={120} onChange={(event) => set("email", event.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Instagram" hint="Link completo do perfil.">
                  <Input value={form.instagram} maxLength={300} placeholder="https://instagram.com/…" onChange={(event) => set("instagram", event.target.value)} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Galeria de fotos</CardTitle>
              <CardDescription>
                Até 12 fotos, de até 8 MB cada. As fotos só são enviadas quando você clicar em Salvar. Sem fotos, a galeria não aparece na página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.galleryImages.length + pending.length > 0 && (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {form.galleryImages.map((url) => (
                    <li key={url} className="relative aspect-square overflow-hidden rounded-md border">
                      <Image src={url} alt="Foto da galeria" fill unoptimized className="object-cover" />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-1 top-1 size-8"
                        aria-label="Remover foto"
                        onClick={() => set("galleryImages", form.galleryImages.filter((item) => item !== url))}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </li>
                  ))}
                  {pending.map((item) => (
                    <li key={item.id} className="relative aspect-square overflow-hidden rounded-md border border-dashed border-primary">
                      <Image src={item.preview} alt="Nova foto, ainda não enviada" fill unoptimized className="object-cover" />
                      <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">Nova</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute right-1 top-1 size-8"
                        aria-label="Remover foto nova"
                        onClick={() => {
                          URL.revokeObjectURL(item.preview);
                          setPending((current) => current.filter((other) => other.id !== item.id));
                        }}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = "";
                  if (files.length === 0) return;
                  if (form.galleryImages.length + pending.length + files.length > 12) {
                    toastError("A galeria aceita no máximo 12 fotos.");
                    return;
                  }
                  if (files.some((file) => file.size > 8 * 1024 * 1024)) {
                    toastError("Cada foto pode ter até 8 MB.");
                    return;
                  }
                  setPending((current) => [
                    ...current,
                    ...files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) })),
                  ]);
                }}
              />
              <Button type="button" variant="outline" disabled={form.galleryImages.length + pending.length >= 12} onClick={() => fileInput.current?.click()}>
                <ImagePlus className="mr-1" />
                Adicionar fotos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dirty && (
        <div
          role="region"
          aria-label="Alterações não salvas"
          className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-lg md:bottom-6"
        >
          <span className="text-sm font-medium">Alterações não salvas</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={save.isPending || uploading} onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={save.isPending || uploading} onClick={() => void handleSave()}>
              {save.isPending || uploading ? <Loader2 className="mr-1 animate-spin" /> : <Save className="mr-1" />}
              {uploading ? "Enviando fotos…" : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default function SettingsPage() {
  const { data, isLoading, error, refetch } = api.site.get.useQuery(undefined, { refetchOnWindowFocus: false });

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }
  if (error || !data) {
    return (
      <PageContainer>
        <ErrorDisplay message={error?.message ?? "Não foi possível carregar as configurações."} onRetry={() => void refetch()} />
      </PageContainer>
    );
  }
  return <SettingsForm initial={data} />;
}
