/**
 * Katalog egg/game yang bisa dipilih customer saat order panel.
 * Sinkron dengan data/eggs.json. Untuk game Minecraft/SA-MP/etc, pastikan
 * egg sudah di-import di panel Pterodactyl Anda.
 */
import eggsData from "@/data/eggs.json";

export type Egg = {
  id: number;
  nestId: number;
  name: string;
  dockerImage: string;
  startup: string;
  environment?: Record<string, string>;
};

export type EggConfig = Egg;

export const eggs = eggsData as Egg[];

export function getEggById(id: number): Egg | undefined {
  return eggs.find((e) => e.id === id);
}

export function isValidEgg(id: number): boolean {
  return eggs.some((e) => e.id === id);
}
