const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ufFormatter = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCLP(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "$0";
  return clpFormatter.format(num);
}

export function formatUF(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0,00 UF";
  return `${ufFormatter.format(num)} UF`;
}

export function formatCurrency(amount: number | string, currency: string = "CLP"): string {
  if (currency === "UF") return formatUF(amount);
  return formatCLP(amount);
}
