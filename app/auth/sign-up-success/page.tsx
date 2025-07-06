import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Pendaftaran Berhasil!</h1>
            <p className="text-gray-600 text-center leading-relaxed">
              Terima kasih telah bergabung dengan kami. Silakan periksa email Anda untuk konfirmasi akun.
            </p>
          </div>

          {/* Success Message */}
          <div className="text-green-700 text-sm text-center bg-green-50 border border-green-200 p-4 rounded-xl">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span>Email konfirmasi telah dikirim ke kotak masuk Anda</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center"
            >
              Lanjut ke Login →
            </Link>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-gray-400 text-sm font-medium">atau</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Tidak menerima email? </span>
                  <Link
                    href="/auth/sign-up"
                    className="text-green-600 hover:text-green-700 font-semibold transition-colors duration-200"
                  >
                    Daftar Ulang
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
