import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * A clean, modern, minimal Back button component.
 *
 * Props:
 * - text (string): Button label (default: "Back")
 * - to (string): Optional route to navigate to. If not provided, goes back one step.
 * - color (string): Tailwind text color (default: "blue")
 * - className (string): Extra Tailwind classes
 */
const BackButton = ({ text = "Back", to = null, color = "blue", className = "" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  // ✅ Tailwind-safe color classes
  const colorMap = {
    blue: "text-blue-600 hover:text-blue-700 focus:ring-blue-500",
    indigo: "text-indigo-600 hover:text-indigo-700 focus:ring-indigo-500",
    gray: "text-gray-600 hover:text-gray-800 focus:ring-gray-400",
  };

  const colorClasses = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={handleClick}
      className={`mb-3 group inline-flex items-center gap-2 font-medium ${colorClasses} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md ${className}`}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
      <span className="text-sm sm:text-base">{text}</span>
    </button>
  );
};

export default BackButton;
