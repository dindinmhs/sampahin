import React from "react";

interface WorkflowStepProps {
  step: number;
  title: string;
  description: string;
  bgColor: string;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({
  step,
  title,
  description,
  bgColor,
}) => {
  return (
    <div className="text-center group">
      <div
        className={`w-20 h-20 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
      >
        <span className="text-2xl font-bold text-white">{step}</span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: "Ambil Foto",
      description:
        "Gunakan kamera ponsel untuk mengambil foto lokasi yang ingin dipantau.",
      bgColor: "bg-green-600",
    },
    {
      step: 2,
      title: "Analisis AI",
      description:
        "Sistem AI akan menganalisis foto dan memberikan skor kebersihan A-E.",
      bgColor: "bg-blue-600",
    },
    {
      step: 3,
      title: "Bagikan Data",
      description:
        "Hasil analisis akan ditampilkan di peta dan dapat dibagikan ke komunitas.",
      bgColor: "bg-purple-600",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Cara Kerja</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Proses sederhana dalam 3 langkah
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <WorkflowStep
              key={index}
              step={step.step}
              title={step.title}
              description={step.description}
              bgColor={step.bgColor}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
