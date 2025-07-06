import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Terjadi Kesalahan</h1>
            <p className="text-gray-600 text-center leading-relaxed mb-6">
              Maaf, terjadi kesalahan pada sistem. Silakan coba lagi atau hubungi tim support jika masalah berlanjut.
            </p>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            {params?.error ? (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-4 rounded-xl">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span>Kode error: {params.error}</span>
                </div>
              </div>
            ) : (
              <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 p-4 rounded-xl">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span>Terjadi kesalahan yang tidak terduga</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center"
            >
              Kembali ke Login →
            </Link>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-sm font-medium">atau</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Butuh bantuan? </span>
                  <Link
                    href="/contact"
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                  >
                    Hubungi Support
                  </Link>
                </div>
                <div>
                  <span className="text-gray-600">Atau coba </span>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                  >
                    Muat Ulang Halaman
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}