// app/app/admin/ministries/_components/ministry-members-dialog.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { api } from "@/trpc/react";

interface MinistryMembersDialogProps {
  ministry: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinistryMembersDialog({ ministry, open, onOpenChange }: MinistryMembersDialogProps) {
  const { data: ministryMembers = [], isLoading } = api.ministry.getMinistryMembers.useQuery(
    { ministryId: ministry?.id },
    { enabled: !!ministry && open }
  );

  if (!ministry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Ministério: {ministry.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Carregando membros...</div>
          ) : ministryMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum membro vinculado a este ministério</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Total: {ministryMembers.length} membro(s)
              </p>
              {ministryMembers.map((member) => (
                <Card key={member.memberId}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{
                              backgroundColor: 
                                member.status === 'active' ? '#f0fdf4' :
                                member.status === 'inactive' ? '#fef2f2' :
                                member.status === 'visiting' ? '#eff6ff' :
                                '#fefce8',
                              color: 
                                member.status === 'active' ? '#166534' :
                                member.status === 'inactive' ? '#dc2626' :
                                member.status === 'visiting' ? '#1d4ed8' :
                                '#ca8a04'
                            }}
                          >
                            {member.status === 'active' ? 'Ativo' :
                             member.status === 'inactive' ? 'Inativo' :
                             member.status === 'visiting' ? 'Visitante' : 'Transferido'}
                          </Badge>
                        </div>
                        {member.functionName && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Função:</span> {member.functionName}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}