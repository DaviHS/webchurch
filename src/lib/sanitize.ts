import { MemberFormData } from "@/validators/member"

type RawMember = {
  [K in keyof MemberFormData]: any
} & {
  ministries?: {
    ministryId: number
    functionId: number | null
    // campos extras da API:
    joinedAt?: Date
    isActive?: boolean
    functionName?: string | null
    ministryName?: string | null
  }[]
}

export function sanitizeMemberForForm(member: RawMember): MemberFormData {
  return {
    ...member,
    email: member.email ?? undefined,
    phone: member.phone ?? undefined,
    whatsapp: member.whatsapp ?? undefined,
    birthDate: member.birthDate ?? undefined,
    gender: member.gender ?? "",           // string vazia se undefined
    maritalStatus: member.maritalStatus ?? "",
    address: member.address ?? undefined,
    city: member.city ?? undefined,
    state: member.state ?? undefined,
    zipCode: member.zipCode ?? undefined,
    baptized: !!member.baptized,           
    baptismDate: member.baptismDate ?? undefined,
    memberSince: member.memberSince ?? undefined,
    status: member.status ?? "active",
    profession: member.profession ?? undefined,
    emergencyContact: member.emergencyContact ?? undefined,
    emergencyPhone: member.emergencyPhone ?? undefined,
    notes: member.notes ?? undefined,
    ministries: member.ministries?.map((m: { ministryId: number; functionId: number | null }) => ({
      ministryId: m.ministryId,
      functionId: m.functionId ?? undefined,
    })) ?? [],
  }
}
