import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const Card = ({
  className,
  icon: Icon,
  children,
  tip,
}: {
  className?: string;
  icon?: LucideIcon;
  children: ReactNode;
  tip?: string;
}) => {
  const comp = (
    <motion.div
      whileHover={{
        scale: 1.05,
        transition: {
          duration: 0.1,
        },
      }}
      className={cn(
        "group flex cursor-pointer items-center justify-between rounded-xl border border-l-4 border-gray-500 px-4 py-2",
        className,
      )}
    >
      <div>{children}</div>
      {Icon && <Icon size={16} />}
    </motion.div>
  );

  if (tip)
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{comp}</TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  return comp;
};

const Title = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <h3 className={cn("text-sm font-black", className)}>{children}</h3>;
};

const Subtitle = ({ children }: { children: ReactNode }) => {
  return <p className="text-xs font-semibold">{children}</p>;
};

Card.Title = Title;
Card.Subtitle = Subtitle;

export { Card };
