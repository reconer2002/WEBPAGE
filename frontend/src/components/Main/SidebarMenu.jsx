import { useEffect, useState } from "react";

const SidebarMenu = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  return (
    <>
      {(isSidebarOpen || isAnimating) && (
        <div
          className={
            isSidebarOpen
              ? "fixed top-0 left-0 w-64 z-50 h-full transition-transform duration-300 ease-in-out bg-white shadow-lg border-r border-black transform translate-x-0"
              : "fixed top-0 left-0 w-64 z-50 h-full transition-transform duration-300 ease-in-out bg-white shadow-lg border-r border-black transform -translate-x-full"
          }
        >
          {/* Botón de cerrar */}
          <div className="flex justify-end mr-2 mt-2">
            <button
              className="text-2xl font-bold cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Logo */}
          <div className="flex justify-center mt-4">
            <span className="text-3xl font-light tracking-wide">FASHION</span>
          </div>

          {/* Opciones del menú */}
          <div className="flex flex-col items-center gap-1 mt-7">
            <button className="py-2 border-y border-gray-300 w-full text-center hover:bg-gray-100">
              Home
            </button>
            <button className="py-2 border-y border-gray-300 w-full text-center hover:bg-gray-100">
              Shop
            </button>
            <button className="py-2 border-y border-gray-300 w-full text-center hover:bg-gray-100">
              Search
            </button>
            <button className="py-2 border-y border-gray-300 w-full text-center hover:bg-gray-100">
              Sign in
            </button>
            <button className="py-2 border-y border-gray-300 w-full text-center hover:bg-gray-100">
              Sign up
            </button>
            <button className="py-2 border-y border-gray-300 w-full text-center hover:bg-gray-100">
              Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarMenu;