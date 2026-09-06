import { User, Building2, Megaphone, LayoutGrid, LucideIcon } from "lucide-react";

export const categoryIcons: Record<string, LucideIcon> = {
  all: LayoutGrid,
  individual: User,
  company: Building2,
  brand: Megaphone,
};

export const defaultCategoryIcon: LucideIcon = LayoutGrid;
