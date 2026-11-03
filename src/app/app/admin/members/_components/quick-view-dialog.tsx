"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  Edit,
  User,
  Heart,
  BookOpen,
  Briefcase,
  Shield,
  AlertCircle
} from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { MemberStatusBadge } from "./member-status-badge";
import type { MemberWithMinistries } from "./types";

interface QuickViewDialogProps {
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

function formatOptionalDate(value: string | null): string {
  return formatDate(value ?? undefined);
}

export function QuickViewDialog({ member, open, onOpenChange, onEdit }: QuickViewDialogProps) {
  if (!member) return null;

  const cityState = [member.city, member.state].filter((part) => part?.trim()).join(", ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              Perfil do membro
            </DialogTitle>
            <div className="flex gap-2 mr-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">
                        {member.firstName} {member.lastName}
                      </h2>
                      <MemberStatusBadge status={member.status} />
                    </div>
                    <p className="text-muted-foreground">
                      Membro desde {formatOptionalDate(member.memberSince)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Informações de contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {textOr(member.email)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      {textOr(member.phone)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      {textOr(member.whatsapp)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de nascimento</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatOptionalDate(member.birthDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gênero</label>
                    <p className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {member.gender ? GENDER_LABELS[member.gender] : NOT_INFORMED}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado civil</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Heart className="h-4 w-4" />
                      {member.maritalStatus ? MARITAL_STATUS_LABELS[member.maritalStatus] : NOT_INFORMED}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Profissão</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-4 w-4" />
                      {textOr(member.profession)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Informações da igreja
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data do batismo</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatOptionalDate(member.baptismDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Membro desde</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatOptionalDate(member.memberSince)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">{textOr(member.address, "Endereço não informado")}</p>
                  {cityState && (
                    <p className="text-sm text-muted-foreground">{cityState}</p>
                  )}
                  {member.zipCode && (
                    <p className="text-sm text-muted-foreground">CEP: {member.zipCode}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Contato de emergência
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p>{textOr(member.emergencyContact)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p>{textOr(member.emergencyPhone)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {member.ministries.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ministérios
                  </h3>
                  <div className="space-y-2">
                    {member.ministries.map((min) => (
                      <div key={min.ministryId} className="flex justify-between items-center py-1">
                        <span className="text-sm">{min.ministryName}</span>
                        {min.functionName && (
                          <Badge variant="secondary" className="text-xs">
                            {min.functionName}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {member.notes && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Observações
              </h3>
              <p className="text-sm whitespace-pre-wrap">{member.notes}</p>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}