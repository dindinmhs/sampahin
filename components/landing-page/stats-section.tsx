import React from "react";

interface StatItemProps {
  number: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ number, label }) => {
  return (
    <div className="text-white">
      <div className="text-4xl font-bold mb-2">{number}</div>
      <div className="text-green-100">{label}</div>
    </div>
  );
};

const StatsSection: React.FC = () => {
  const stats = [
    { number: "10.000+", label: "Titik Pengumpulan" },
    { number: "95%", label: "Tingkat Efisiensi" },
    { number: "50+", label: "Kota Terlayani" },
    { number: "24/7", label: "Dukungan" },
  ];

  return (
    <section className="py-20 bg-green-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <StatItem key={index} number={stat.number} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
