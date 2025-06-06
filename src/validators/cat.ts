import { z } from "zod";
import { format } from "date-fns";

const formatDate = (value: Date): string => format(value, "yyyy-MM-dd");

export const callSchema = z.object({
  date_ini: z
    .union([z.string(), z.date()]) 
    .transform((value) => {
      if (typeof value === "string") {
        return value; 
      }
      return formatDate(value); 
    }),
    
  date_fim: z
    .union([z.string(), z.date()]) 
    .transform((value) => {
      if (typeof value === "string") {
        return value; 
      }
      return formatDate(value); 
    }),
  direction: z.string().nullable(),
  extension: z.string().nullable(),
  group_extensions: z.array(z.string()).optional().default([]).nullable(),
});

export type CallSchema = z.infer<typeof callSchema>;
