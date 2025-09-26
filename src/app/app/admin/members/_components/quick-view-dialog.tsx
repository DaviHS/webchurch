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
  X,
  User,
  Cross,
  Heart,
  BookOpen,
  Briefcase,
  Shield,
  AlertCircle
} from "lucide-react";

interface QuickViewDialogProps {
  member: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (member: any) => void;
}

export function QuickViewDialog({ member, open, onOpenChange, onEdit }: QuickViewDialogProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
      visiting: "bg-blue-100 text-blue-800 border-blue-200",
      transferred: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      visiting: "Visitante",
      transferred: "Transferido",
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getMaritalStatusLabel = (status?: string) => {
    const map = {
      single: "Solteiro(a)",
      married: "Casado(a)",
      divorced: "Divorciado(a)",
      widowed: "Viúvo(a)",
    } as const;
    return status ? map[status as keyof typeof map] : "Não informado";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Não informado";
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              Perfil do Membro
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
          {/* Coluna 1: Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">
                        {member.firstName} {member.lastName}
                      </h2>
                      {getStatusBadge(member.status)}
                    </div>
                    <p className="text-muted-foreground">
                      Membro desde {formatDate(member.memberSince)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {member.email || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      {member.phone || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">WhatsApp</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4" />
                      {member.whatsapp || "Não informado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Pessoais */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(member.birthDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gênero</label>
                    <p className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {member.gender === 'male' ? 'Masculino' : 'Feminino'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Heart className="h-4 w-4" />
                      {getMaritalStatusLabel(member.maritalStatus)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Profissão</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-4 w-4" />
                      {member.profession || "Não informado"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Informações Secundárias */}
          <div className="space-y-6">
            {/* Informações da Igreja */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Informações da Igreja
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data do Batismo</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(member.baptismDate)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Membro desde</label>
                    <p className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(member.memberSince)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="space-y-2">
                  <p className="text-sm">{member.address || "Endereço não informado"}</p>
                  {(member.city || member.state) && (
                    <p className="text-sm text-muted-foreground">
                      {member.city}{member.city && member.state ? ', ' : ''}{member.state}
                    </p>
                  )}
                  {member.zipCode && (
                    <p className="text-sm text-muted-foreground">CEP: {member.zipCode}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contato de Emergência */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Contato de Emergência
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p>{member.emergencyContact || "Não informado"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <p>{member.emergencyPhone || "Não informado"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ministérios */}
            {member.ministries?.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ministérios
                  </h3>
                  <div className="space-y-2">
                    {member.ministries.map((min: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1">
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

        {/* Observações */}
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