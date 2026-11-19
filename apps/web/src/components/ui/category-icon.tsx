import {
  Briefcase,
  Car,
  Circle,
  CircleEllipsis,
  Film,
  House,
  ShoppingBag,
  Utensils,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  zap: Zap,
  film: Film,
  house: House,
  briefcase: Briefcase,
  'circle-ellipsis': CircleEllipsis,
};

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = CATEGORY_ICONS[name] ?? Circle;
  return <Icon {...props} />;
}
