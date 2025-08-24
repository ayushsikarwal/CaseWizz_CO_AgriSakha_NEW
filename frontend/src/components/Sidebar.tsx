import React from 'react';

interface SidebarProps {
  activePage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage = 'home' }) => {
  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-black to-gray-900 border-r border-white/10">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-[#fccd03] mb-6">Menu</h2>
        <nav className="space-y-4">
          <a
            href="/"
            className={`flex items-center transition-colors duration-300 ${
              activePage === 'home' ? 'text-[#fccd03] font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-3">🏠</span>
            Home
          </a>
          <a
            href="/rural-financial-news"
            className={`flex items-center transition-colors duration-300 ${
              activePage === 'rural-financial-news' ? 'text-[#fccd03] font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-3">📰</span>
            Financial News
          </a>
          <a
            href="/budget-assistant"
            className={`flex items-center transition-colors duration-300 ${
              activePage === 'budget-assistant' ? 'text-[#fccd03] font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-3">💰</span>
            Budget Assistant
          </a>
          <a
            href="/loan-assistant"
            className={`flex items-center transition-colors duration-300 ${
              activePage === 'loan-assistant' ? 'text-[#fccd03] font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-3">💳</span>
            Loan Assistant
          </a>
          <a
            href="/agri-assistant"
            className={`flex items-center transition-colors duration-300 ${
              activePage === 'agri-assistant' ? 'text-[#fccd03] font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <span className="mr-3">📈</span>
            Agricultural Advisor
          </a>
          <a
            href="http://localhost:8080/"
            className="flex items-center text-gray-400 hover:text-white transition-colors duration-300"
          >
            <span className="mr-3">💬</span>
            Community
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
