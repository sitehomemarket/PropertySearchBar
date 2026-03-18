import React from 'react';
import { Wifi, RefreshCw } from 'lucide-react';

interface HeaderProps {
  autoSyncEnabled?: boolean;
  lastSyncTime?: Date | null;
}

const Header: React.FC<HeaderProps> = ({ autoSyncEnabled = false, lastSyncTime }) => {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'לא עודכן';
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img 
              src="https://images2.madlan.co.il/t:nonce:v=2;resize:height=600,withoutEnlargement=true;convert:type=webp/realEstateAgent/office/re_office_dbPNCotu70M_1716294720493.jpg"
              alt="HomeMarket Logo"
              className="h-10 w-auto object-contain rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-[#222222]">HomeMarket</h1>
              <p className="text-sm text-gray-600">מנוע חיפוש נכסים</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Wifi className={`w-4 h-4 ${autoSyncEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <div className="text-right">
                  <div className={`font-medium ${autoSyncEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {autoSyncEnabled ? 'סנכרון אוטומטי' : 'סנכרון ידני'}
                  </div>
                  <div className="text-xs text-gray-500">
                    עדכון: {formatLastSync(lastSyncTime)}
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('manualSync'))}
              className="flex items-center gap-2 px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors text-sm font-medium shadow-sm"
              title="בדוק שינויים וסנכרן נתונים"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">סנכרן עכשיו</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;