import React from "react";
import Link from "next/link";

const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Siap Mentransformasi Kota Anda?
        </h2>
        <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Bergabunglah dengan ribuan kota yang sudah menggunakan Sampahin untuk
          meningkatkan sistem pengelolaan sampah mereka.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/map"
            className="block bg-green-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-full text-base sm:text-lg font-semibold hover:bg-green-700 text-center"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
