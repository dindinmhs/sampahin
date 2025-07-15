import React from "react";
import { MapPin } from "lucide-react";

interface FooterSectionProps {
  title: string;
  links: Array<{ label: string; href: string }>;
}

const FooterSection: React.FC<FooterSectionProps> = ({ title, links }) => {
  return (
    <div>
      <h4 className="font-semibold mb-4">{title}</h4>
      <ul className="space-y-2 text-gray-400">
        {links.map((link, index) => (
          <li key={index}>
            <a href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer: React.FC = () => {
  const footerSections = [
    {
      title: "Produk",
      links: [
        { label: "Fitur AI", href: "#" },
        { label: "Peta Interaktif", href: "#" },
        { label: "Laporan", href: "#" },
      ],
    },
    {
      title: "Perusahaan",
      links: [
        { label: "Tentang Kami", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Kontak", href: "#" },
      ],
    },
    {
      title: "Dukungan",
      links: [
        { label: "Pusat Bantuan", href: "#" },
        { label: "Dokumentasi", href: "#" },
        { label: "FAQ", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Sampahin</span>
            </div>
            <p className="text-gray-400">
              Platform monitoring kebersihan berbasis AI untuk lingkungan yang
              lebih bersih dan sehat.
            </p>
          </div>

          {footerSections.map((section, index) => (
            <FooterSection
              key={index}
              title={section.title}
              links={section.links}
            />
          ))}
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 Sampahin. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
