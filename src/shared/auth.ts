import { timingSafeEqual } from "node:crypto";

/** Constant-time string compare, so a wrong key leaks nothing through timing. */
export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
