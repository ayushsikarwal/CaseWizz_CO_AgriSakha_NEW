import React from 'react';

const Header: React.FC = () => {
  return (
    <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-8">
            <span className="text-3xl font-extrabold text-[#fccd03] font-sans">
              <img src="/logo.png" alt="AgriSakha Logo" className="h-42 w-48 inline-block align-middle" />
            </span>
            <div className="hidden md:flex space-x-8">
              <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">Home</a>
              <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">Product</a>
              <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">Features</a>
              <a href="#" className="text-white hover:text-[#fccd03] transition-colors font-medium">About</a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
