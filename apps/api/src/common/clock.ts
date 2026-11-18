import { todayInJakarta, type DateOnly } from '@coinbook/shared';
import type { Env } from '../config/env';

export function businessToday(env: Env, now: Date = new Date()): DateOnly {
  return env.COINBOOK_FIXED_TODAY ?? todayInJakarta(now);
}
