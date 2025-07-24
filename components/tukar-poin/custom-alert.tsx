import React from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
}

export function CustomAlert({
  isOpen,
  onClose,
  type,
  title,
  message,
}: CustomAlertProps) {
  if (!isOpen) return null;

  const bgColor = type === "success" ? "bg-green-50" : "bg-red-50";
  const borderColor =
    type === "success" ? "border-green-200" : "border-red-200";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const iconColor = type === "success" ? "text-green-600" : "text-red-600";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${bgColor} ${borderColor} border rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg`}
      >
        <div className="flex items-start gap-3">
          <div className={`${iconColor} flex-shrink-0`}>
            {type === "success" ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <AlertCircle className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${textColor} mb-2`}>
              {title}
            </h3>
            <p className={`${textColor} text-sm`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${textColor} hover:opacity-70 transition-opacity`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${
              type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white rounded-md transition-colors text-sm font-medium`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
