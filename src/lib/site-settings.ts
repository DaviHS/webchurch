import { z } from "zod";

export const MAX_GALLERY_PHOTOS = 12;
export const MAX_PHOTO_MB = 8;

const text = (max: number) => z.string().trim().max(max);
const optionalUrl = z.union([z.literal(""), z.string().trim().url().max(300)]);

export const siteSettingsSchema = z.object({
  name: text(80).min(1, "Informe o nome da igreja"),
  tagline: text(120),
  heroTitle: text(120),
  heroSubtitle: text(160),
  aboutIntro: text(600),
  aboutCards: z.array(z.object({ title: text(60), text: text(400) })).length(3),
  services: z
    .array(
      z.object({
        title: text(80).min(1, "Informe o nome do culto"),
        day: text(60),
        time: text(40),
        place: text(160),
        description: text(400),
      }),
    )
    .max(8),
  historyIntro: text(400),
  history: z.array(z.object({ title: text(60), text: text(1200) })).max(6),
  street: text(160),
  city: text(160),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido").max(120)]),
  whatsapp: text(30),
  instagram: optionalUrl,
  galleryImages: z.array(z.string().trim().url("Link de foto inválido").max(500)).max(MAX_GALLERY_PHOTOS),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  name: "Igreja Central",
  tagline: "Vida Com Propósito",
  heroTitle: "Bem-vindo à Igreja Central",
  heroSubtitle: "Uma Vida Com Propósito",
  aboutIntro:
    "A Igreja Central é um lugar onde todos são bem-vindos para adorar a Deus, crescer na fé e servir à comunidade. Nossa missão é levar a mensagem de esperança e amor de Jesus Cristo a todos.",
  aboutCards: [
    {
      title: "Nossa Missão",
      text: "Proclamar o evangelho de Jesus Cristo, fazendo discípulos e transformando vidas através da Palavra de Deus.",
    },
    {
      title: "Nossos Valores",
      text: "Fé, amor, comunhão, serviço e compromisso com a verdade bíblica são os pilares que sustentam nossa comunidade.",
    },
    {
      title: "Nossa Comunidade",
      text: "Somos uma família diversa e acolhedora, unida pelo amor de Cristo e pelo desejo de servir a Deus e ao próximo.",
    },
  ],
  services: [
    {
      title: "Culto da Família",
      day: "Domingo",
      time: "18:00",
      place: "Rua Jamil João Zarif, 1408 - Jardim Santa Vicencia",
      description:
        "Culto de celebração e adoração, onde nos reunimos para louvar a Deus, ouvir a Palavra e fortalecer nossa fé em comunhão.",
    },
    {
      title: "Culto Mulheres de Fé",
      day: "Quarta-feira",
      time: "19:30",
      place: "Rua Jamil João Zarif, 1408 - Jardim Santa Vicencia",
      description: "Um momento dedicado à intercessão e à busca da presença de Deus, fortalecendo a fé.",
    },
    {
      title: "Raízes",
      day: "Dias variados",
      time: "19:30",
      place: "Endereços variados. Entre em contato para saber mais!",
      description:
        "Um encontro próximo para compartilhar, estudar e viver a Palavra de Deus juntos, em intimidade e comunhão.",
    },
  ],
  historyIntro: "Conheça a trajetória da Igreja Central e como Deus tem nos guiado ao longo dos anos.",
  history: [
    { title: "Fundação", text: "Em Desenvolvimento." },
    { title: "Crescimento", text: "Em Desenvolvimento." },
    { title: "Atualidade", text: "Em Desenvolvimento." },
  ],
  street: "Rua Jamil João Zarif, 1408 - Jardim Santa Vicencia",
  city: "Guarulhos - São Paulo, CEP 07143-000",
  email: "",
  whatsapp: "",
  instagram: "https://instagram.com/igrejacentralvcp/",
  galleryImages: [],
};

export const mapsLink = (settings: Pick<SiteSettings, "street" | "city">) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${settings.street}, ${settings.city}`)}`;

export const mapsEmbedLink = (settings: Pick<SiteSettings, "street" | "city">) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(`${settings.street}, ${settings.city}`)}&z=16&output=embed`;

export const whatsappLink = (whatsapp: string) => {
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
};
