export type RamValue = 1024 | 2048 | 3072 | 4096 | 5120 | 0;
export type DiskValue = 1024 | 2048 | 3072 | 4096 | 5120 | 0;
export type CpuValue = 60 | 70 | 90 | 100 | 150 | 250 | 0;

export type PanelSelection = {
  ram: RamValue;
  disk: DiskValue;
  cpu: CpuValue;
  eggId: number;
  nestId: number;
};

export const RAM_OPTIONS: { value: RamValue; label: string }[] = [
  { value: 1024, label: "1 GB" },
  { value: 2048, label: "2 GB" },
  { value: 3072, label: "3 GB" },
  { value: 4096, label: "4 GB" },
  { value: 5120, label: "5 GB" },
  { value: 0, label: "Unlimited" }
];

export const DISK_OPTIONS: { value: DiskValue; label: string }[] = [
  { value: 1024, label: "1 GB" },
  { value: 2048, label: "2 GB" },
  { value: 3072, label: "3 GB" },
  { value: 4096, label: "4 GB" },
  { value: 5120, label: "5 GB" },
  { value: 0, label: "Unlimited" }
];

export const CPU_OPTIONS: { value: CpuValue; label: string }[] = [
  { value: 60, label: "60%" },
  { value: 70, label: "70%" },
  { value: 90, label: "90%" },
  { value: 100, label: "100%" },
  { value: 150, label: "150%" },
  { value: 250, label: "250%" },
  { value: 0, label: "Unlimited" }
];

const PRICING = {
  ramPerGb: 600,
  ramUnlimited: 4000,
  diskPerGb: 600,
  diskUnlimited: 3500,
  cpu: {
    60: 400,
    70: 500,
    90: 700,
    100: 800,
    150: 900,
    250: 1100,
    0: 3500
  } as Record<CpuValue, number>
};

export function calculatePanelPrice(selection: PanelSelection): number {
  let total = 0;
  total += selection.ram === 0 ? PRICING.ramUnlimited : (selection.ram / 1024) * PRICING.ramPerGb;
  total += selection.disk === 0 ? PRICING.diskUnlimited : (selection.disk / 1024) * PRICING.diskPerGb;
  total += PRICING.cpu[selection.cpu] ?? 0;
  return Math.round(total);
}

export function calculateRenewPrice(ram: number, disk: number, cpu: number): number {
  let total = 0;
  total += ram === 0 ? PRICING.ramUnlimited : (ram / 1024) * PRICING.ramPerGb;
  total += disk === 0 ? PRICING.diskUnlimited : (disk / 1024) * PRICING.diskPerGb;
  total += PRICING.cpu[cpu as CpuValue] ?? 0;
  return Math.round(total);
}

export function isValidSelection(value: unknown): value is PanelSelection {
  if (!value || typeof value !== "object") return false;
  const sel = value as PanelSelection;
  return (
    RAM_OPTIONS.some((o) => o.value === sel.ram) &&
    DISK_OPTIONS.some((o) => o.value === sel.disk) &&
    CPU_OPTIONS.some((o) => o.value === sel.cpu) &&
    typeof sel.eggId === "number" &&
    typeof sel.nestId === "number"
  );
}

export function describeSelection(selection: PanelSelection) {
  const ram = selection.ram === 0 ? "Unlimited RAM" : `${selection.ram / 1024} GB RAM`;
  const disk = selection.disk === 0 ? "Unlimited Disk" : `${selection.disk / 1024} GB Disk`;
  const cpu = selection.cpu === 0 ? "Unlimited CPU" : `${selection.cpu}% CPU`;
  return `${ram} / ${disk} / ${cpu}`;
}
