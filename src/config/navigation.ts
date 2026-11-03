import {
  BarChart3,
  Calendar,
  DollarSign,
  Home,
  Music,
  Shield,
  UserCheck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: "pendingUsers";
}

export interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavLink[];
}

export const HOME_LINK: NavLink = { title: "Início", url: "/app", icon: Home };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Adoração",
    icon: Music,
    items: [
      { title: "Músicas", url: "/app/praise/songs", icon: Music },
      { title: "Eventos", url: "/app/praise/events", icon: Calendar },
      { title: "Relatórios", url: "/app/praise/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Administração",
    icon: Shield,
    items: [
      { title: "Membros", url: "/app/admin/members", icon: Users },
      { title: "Aprovações", url: "/app/admin/members/pending", icon: UserCheck, badge: "pendingUsers" },
      { title: "Ministérios e Funções", url: "/app/admin/ministries", icon: Workflow },
      { title: "Finanças", url: "/app/admin/finance", icon: DollarSign },
    ],
  },
];

export const MOBILE_PRIMARY_URLS = ["/app", "/app/praise/songs", "/app/praise/events", "/app/admin/members"];

export const QUICK_ACTIONS: { title: string; url: string; icon: LucideIcon }[] = [
  { title: "Nova música", url: "/app/praise/songs?novo=1", icon: Music },
  { title: "Novo evento", url: "/app/praise/events?novo=1", icon: Calendar },
  { title: "Novo membro", url: "/app/admin/members?novo=1", icon: Users },
];

export const ALL_LINKS: NavLink[] = [HOME_LINK, ...NAV_SECTIONS.flatMap((section) => section.items)];

export interface Breadcrumb {
  label: string;
  href?: string;
}

const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

export function findActiveLink(pathname: string): { section: NavSection | null; link: NavLink } | null {
  const path = normalize(pathname);
  let best: { section: NavSection | null; link: NavLink } | null = null;

  for (const section of NAV_SECTIONS) {
    for (const link of section.items) {
      const matches = path === link.url || path.startsWith(`${link.url}/`);
      if (matches && (!best || link.url.length > best.link.url.length)) best = { section, link };
    }
  }
  if (!best && path === HOME_LINK.url) best = { section: null, link: HOME_LINK };
  return best;
}

export function getBreadcrumbs(pathname: string): Breadcrumb[] {
  const active = findActiveLink(pathname);
  if (!active || active.link === HOME_LINK) return [{ label: HOME_LINK.title }];

  const crumbs: Breadcrumb[] = [{ label: HOME_LINK.title, href: HOME_LINK.url }];
  if (active.section) crumbs.push({ label: active.section.title });
  crumbs.push({ label: active.link.title });
  return crumbs;
}
