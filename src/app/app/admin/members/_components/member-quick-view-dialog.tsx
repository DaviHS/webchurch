"use client";

import { whatsappNumber } from "@/lib/birthdays";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Calendar,
  Edit,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, fullName } from "@/lib/formatters";
import { MemberStatusBadge } from "./member-status-badge";
import type { MemberWithMinistries } from "./types";

interface MemberQuickViewDialogProps {
  member: MemberWithMinistries | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (member: MemberWithMinistries) => void;
}

const NOT_INFORMED = "Não informado";

const GENDER_LABELS: Record<NonNullable<MemberWithMinistries["gender"]>, string> = {
  male: "Masculino",
  female: "Feminino",
};

const MARITAL_STATUS_LABELS: Record<NonNullable<MemberWithMinistries["maritalStatus"]>, string> = {
  single: "Solteiro(a)",
  married: "Casado(a)",
  divorced: "Divorciado(a)",
  widowed: "Viúvo(a)",
};

function textOr(value: string | null | undefined, fallback: string = NOT_INFORMED): string {
  return value?.trim() ? value : fallback;
}

function dateOr(value: string | null): string {
  return formatDate(value) || NOT_INFORMED;
}

function InfoSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold sm:mb-4">
          <Icon className="size-4 shrink-0" />
          {title}
        </h3>
        {children}
      </CardContent>
    </Card>
  );
}

function InfoField({ label, icon: Icon, children }: { label: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-1 flex min-w-0 items-center gap-2 break-words">
        {Icon && <Icon className="size-4 shrink-0" />}
        <span className="min-w-0 break-words">{children}</span>
      </p>
    </div>
  );
}

export function MemberQuickViewDialog({ member, open, onOpenChange, onEdit }: MemberQuickViewDialogProps) {
  if (!member) return null;

  const cityState = [member.city, member.state].filter((part) => part?.trim()).join(", ");

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent size="xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <User className="size-5 shrink-0 text-primary" />
            Perfil do membro
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            Informações cadastrais de {fullName(member)}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="space-y-4 pb-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="min-w-0 break-words text-xl font-bold sm:text-2xl">{fullName(member)}</h2>
                    <MemberStatusBadge status={member.status} />
                  </div>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Membro desde {dateOr(member.memberSince)}
                  </p>
                </CardContent>
              </Card>

              <InfoSection title="Informações de contato" icon={Mail}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoField label="Email" icon={Mail}>
                    <span className="break-all">{textOr(member.email)}</span>
                  </InfoField>
                  <InfoField label="Telefone" icon={Phone}>
                    {member.phone ? (
                      <a href={`tel:${member.phone}`} className="underline-offset-4 hover:underline">
                        {member.phone}
                      </a>
                    ) : (
                      NOT_INFORMED
                    )}
                  </InfoField>
                  <InfoField label="WhatsApp" icon={Phone}>
                    {whatsappNumber(member.whatsapp) ? (
                      <a
                        href={`https://wa.me/${whatsappNumber(member.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {member.whatsapp}
                      </a>
                    ) : (
                      textOr(member.whatsapp)
                    )}
                  </InfoField>
                </div>
              </InfoSection>

              <InfoSection title="Informações pessoais" icon={User}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoField label="Data de nascimento" icon={Calendar}>
                    {dateOr(member.birthDate)}
                  </InfoField>
                  <InfoField label="Gênero" icon={User}>
                    {member.gender ? GENDER_LABELS[member.gender] : NOT_INFORMED}
                  </InfoField>
                  <InfoField label="Estado civil" icon={Heart}>
                    {member.maritalStatus ? MARITAL_STATUS_LABELS[member.maritalStatus] : NOT_INFORMED}
                  </InfoField>
                  <InfoField label="Profissão" icon={Briefcase}>
                    {textOr(member.profession)}
                  </InfoField>
                </div>
              </InfoSection>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <InfoSection title="Informações da igreja" icon={BookOpen}>
                <div className="space-y-3">
                  <InfoField label="Data do batismo" icon={Calendar}>
                    {dateOr(member.baptismDate)}
                  </InfoField>
                  <InfoField label="Membro desde" icon={Calendar}>
                    {dateOr(member.memberSince)}
                  </InfoField>
                </div>
              </InfoSection>

              <InfoSection title="Endereço" icon={MapPin}>
                <div className="space-y-2 text-sm">
                  <p className="break-words">{textOr(member.address, "Endereço não informado")}</p>
                  {cityState && <p className="text-muted-foreground">{cityState}</p>}
                  {member.zipCode && <p className="text-muted-foreground">CEP: {member.zipCode}</p>}
                </div>
              </InfoSection>

              <InfoSection title="Contato de emergência" icon={AlertCircle}>
                <div className="space-y-2">
                  <InfoField label="Nome">{textOr(member.emergencyContact)}</InfoField>
                  <InfoField label="Telefone">{textOr(member.emergencyPhone)}</InfoField>
                </div>
              </InfoSection>

              {member.ministries.length > 0 && (
                <InfoSection title="Ministérios" icon={Users}>
                  <div className="space-y-2">
                    {member.ministries.map((min) => (
                      <div key={min.ministryId} className="flex flex-wrap items-center justify-between gap-2 py-1">
                        <span className="min-w-0 break-words text-sm">{min.ministryName}</span>
                        {min.functionName && <Badge variant="secondary">{min.functionName}</Badge>}
                      </div>
                    ))}
                  </div>
                </InfoSection>
              )}
            </div>
          </div>

          {member.notes && (
            <InfoSection title="Observações" icon={Shield}>
              <p className="whitespace-pre-wrap break-words text-sm">{member.notes}</p>
            </InfoSection>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </ResponsiveDialogClose>
          <Button onClick={() => onEdit(member)}>
            <Edit className="mr-2 size-4" />
            Editar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
