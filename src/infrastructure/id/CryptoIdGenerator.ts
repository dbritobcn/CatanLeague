import { randomUUID } from "node:crypto";
import type { IdGenerator } from "@/application/ports/IdGenerator";

export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}
