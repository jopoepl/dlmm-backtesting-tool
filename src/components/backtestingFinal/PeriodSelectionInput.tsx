"use client";

import React from "react";

import { Calendar } from "lucide-react";

interface PeriodSelectionInputProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const PeriodSelectionInput: React.FC<PeriodSelectionInputProps> = ({
  selectedPeriod,
  onPeriodChange,
}) => {
  const handlePeriodChange = (value: string) => {
    onPeriodChange(value);
  };

  const getPeriodLabel = (value: string) => {
    const labels: { [key: string]: string } = {
      "1d": "Last 24 Hours",
      "7d": "Last 7 Days",
      "30d": "Last 30 Days",
      "90d": "Last 90 Days",
      "1y": "Last Year",
      custom: "Custom Range",
    };
    return labels[value] || "Select time period";
  };

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">
            Select Analysis Period
          </h3>
        </div>
        <span className="text-sm font-semibold text-blue-600">
          {getPeriodLabel(selectedPeriod)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="flex gap-1">
          {[
            { value: "1d", label: "1D" },
            { value: "7d", label: "7D" },
            { value: "30d", label: "30D" },
            { value: "90d", label: "90D" },
            { value: "1y", label: "1Y" },
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={`px-3 py-1 text-xs rounded ${
                selectedPeriod === period.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeriodSelectionInput;
