export const SAFE_ERROR_MESSAGES: Record<number, string> = {
    400: "Data yang dikirim tidak valid. Periksa kembali formulir.",
    401: "Sesi Anda telah berakhir. Silakan login kembali.",
    403: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
    404: "Data yang diminta tidak ditemukan.",
    409: "Data sudah ada atau terjadi konflik. Coba lagi.",
    500: "Terjadi gangguan pada server. Hubungi administrator.",
};

export function getSafeErrorMessage(status?: number): string {
    if (status && SAFE_ERROR_MESSAGES[status]) {
        return SAFE_ERROR_MESSAGES[status];
    }
    return "Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.";
}