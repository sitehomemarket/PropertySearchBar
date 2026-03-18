import React, { useState } from 'react';
import { Settings, RefreshCw, Eye, EyeOff, Star, Clock, Play, Pause } from 'lucide-react';

interface AdminPanelProps {
  onRefreshData: () => void;
  isLoading: boolean;
  filtersEnabled: boolean;
  onToggleFilters: () => void;
  featuredCount: number;
  lastSyncTime?: Date | null;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  onRefreshData,
  isLoading,
  filtersEnabled,
  onToggleFilters,
  featuredCount,
  lastSyncTime,
  autoSyncEnabled = false,
  onToggleAutoSync
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'לא עודכן';
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded && (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-3 min-w-[280px]">
          <h3 className="text-lg font-semibold text-[#222222] mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            פאנל ניהול
          </h3>
          
          <div className="space-y-3">
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-4 py-2 bg-[#3366FF] text-white rounded-lg hover:bg-[#2952CC] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'מרענן...' : 'רענן נתונים'}
            </button>
            
            {onToggleAutoSync && (
              <button
                onClick={onToggleAutoSync}
                className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  autoSyncEnabled 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-gray-100 text-[#222222] hover:bg-gray-200'
                }`}
              >
                {autoSyncEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {autoSyncEnabled ? 'השבת סנכרון אוטומטי' : 'הפעל סנכרון אוטומטי'}
              </button>
            )}
            
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <Clock className="w-4 h-4" />
              <div>
                <div>עדכון אחרון: {formatLastSync(lastSyncTime)}</div>
                <div className="text-xs text-blue-600">
                  {autoSyncEnabled ? 'סנכרון כל 2 דקות' : 'סנכרון ידני'}
                </div>
              </div>
            </div>
            
            <button
              onClick={onToggleFilters}
              className="w-full flex items-center gap-2 px-4 py-2 bg-gray-100 text-[#222222] rounded-lg hover:bg-gray-200 transition-colors"
            >
              {filtersEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {filtersEnabled ? 'הסתר מסננים' : 'הצג מסננים'}
            </button>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F4E851] text-[#222222] rounded-lg">
              <Star className="w-4 h-4" />
              {featuredCount} נכסים מומלצים
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg transition-colors ${
          autoSyncEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-[#3366FF] hover:bg-[#2952CC]'
        }`}
      >
        {autoSyncEnabled ? <Clock className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default AdminPanel;