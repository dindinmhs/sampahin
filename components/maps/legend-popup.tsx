import React from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface LegendPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const LegendPopup: React.FC<LegendPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Popup Box - positioned at bottom right */}
      <div className="fixed bottom-36 right-2 z-[2001] bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4 w-fit">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-sm font-medium text-gray-700">Legenda</h3>
          <button onClick={onClose}>
            <X size={22} className="text-green-600 hover:text-green-800" />
          </button>
        </div>

        {/* Legend Items */}
        <div className="flex justify-center items-end space-x-12 mt-2">
          {/* Kotor */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center">
              <Image
                src="/dirty.png"
                alt="Kotor"
                width={45}
                height={45}
                className="object-contain"
              />
            </div>
            <span className="text-sm mt-1 min-h-[2.5rem] flex items-center justify-center">
              Kotor
            </span>
          </div>

          {/* Dalam Pembersihan */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center">
              <Image
                src="/cleaning.png"
                alt="Dalam Pembersihan"
                width={45}
                height={45}
                className="object-contain"
              />
            </div>
            <span className="text-sm mt-1 min-h-[2.5rem] flex items-center justify-center leading-tight">
              Dalam
              <br />
              Pembersihan
            </span>
          </div>

          {/* Bersih */}
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center">
              <Image
                src="/clean.png"
                alt="Bersih"
                width={45}
                height={45}
                className="object-contain"
              />
            </div>
            <span className="text-sm mt-1 min-h-[2.5rem] flex items-center justify-center">
              Bersih
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegendPopup;
