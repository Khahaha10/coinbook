import {
  Briefcase,
  Bus,
  Car,
  Circle,
  CircleEllipsis,
  Coffee,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  PiggyBank,
  Plane,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wallet,
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
  coffee: Coffee,
  bus: Bus,
  plane: Plane,
  smartphone: Smartphone,
  gift: Gift,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  'circle-ellipsis': CircleEllipsis,
};

export const PICKABLE_ICONS = Object.keys(CATEGORY_ICONS).filter((n) => n !== 'circle-ellipsis');

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = CATEGORY_ICONS[name] ?? Circle;
  return <Icon {...props} />;
}
