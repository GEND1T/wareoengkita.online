
export function formatRupiah(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num) || num === null || num === undefined) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(num);
}

/**
 * Memunculkan titik pemisah ribuan saat user mengetik angka di form (contoh: "1000000" -> "1.000.000")
 */
export function formatNumberInput(value: string): string {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) return "";
    return new Intl.NumberFormat('id-ID').format(parseInt(cleanValue, 10));
}

/**
 * Mengubah string bermata uang/berformat titik kembali ke number murni (contoh: "1.000.000" -> 1000000)
 */
export function parseCurrencyToNumber(value: string | number): number {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
}