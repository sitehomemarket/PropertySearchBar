import React, { useState } from 'react';
import { Property } from '../types/Property';
import { Send, Mail, Printer, X, Heart, MessageCircle, Download } from 'lucide-react';

interface ClientSelectionPanelProps {
  selectedProperties: Property[];
  onClearSelections: () => void;
}

const ClientSelectionPanel: React.FC<ClientSelectionPanelProps> = ({
  selectedProperties,
  onClearSelections
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const generatePropertyList = () => {
    return selectedProperties.map((property, index) => 
      `‏${index + 1}. נכס מספר ${index + 1}
‏📍 מיקום: ${property.רחוב} ${property.מספר_בניין}, ${property.שכונה}, ${property.עיר}
‏🏢 פרויקט: ${property.שם_הנכס_שיוצג_באתר}
‏🏠 סוג נכס: ${property.סוג_נכס} | קומה ${property.קומה} | דירה מס' ${property.מספר_דירה}
‏🛏 מספר חדרים: ${property.מספר_חדרים}
‏📐 שטח דירה: ${property.שטח_דירה} מ"ר
${property.שטח_מרפסת > 0 ? `‏🌇 מרפסת: ${property.שטח_מרפסת} מ"ר` : ''}
${property.שטח_גינה > 0 ? `‏🌳 גינה: ${property.שטח_גינה} מ"ר` : ''}
‏🚗 חניה: ${property.סוג_חניה}, ${property.כמות_חניות} מקומות
‏💰 מחיר מבוקש: ${property.מחיר_מבוקש.toLocaleString('he-IL')} ₪
${property.pdfLink !== '#' ? `‏📄 תכנית דירה: ${property.pdfLink}` : ''}

`
    ).join('\n');
  };

  const sendWhatsApp = () => {
    if (!clientPhone) {
      alert('אנא הזן מספר טלפון של הלקוח');
      return;
    }

    const message = `‏שלום ${clientName || 'לקוח יקר'},

‏הכנתי עבורך רשימה של ${selectedProperties.length} נכסים מתאימים:

‏${generatePropertyList()}

‏אשמח לתאם צפייה בנכסים שמעניינים אותך.
‏בברכה,
‏צוות HomeMarket`;

    const whatsappUrl = `https://wa.me/972${clientPhone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendEmail = () => {
    if (!clientEmail) {
      alert('אנא הזן כתובת מייל של הלקוח');
      return;
    }

    const subject = `נכסים מתאימים עבור ${clientName || 'לקוח יקר'} - HomeMarket`;
    
    // Create simple RTL text email that works in all email clients
    const emailBody = `שלום ${clientName || 'לקוח יקר'},

הכנתי עבורך רשימה של ${selectedProperties.length} נכסים מתאימים:

═══════════════════════════════════════════════════════════════

${selectedProperties.map((property, index) => 
`נכס מספר ${index + 1}
───────────────────────────────────────────────────────────────
📍 מיקום: ${property.רחוב} ${property.מספר_בניין}, ${property.שכונה}, ${property.עיר}
🏢 פרויקט: ${property.שם_הנכס_שיוצג_באתר}
🏠 סוג נכס: ${property.סוג_נכס} | קומה ${property.קומה} | דירה מס' ${property.מספר_דירה}
🛏 מספר חדרים: ${property.מספר_חדרים}
📐 שטח דירה: ${property.שטח_דירה} מ"ר
${property.שטח_מרפסת > 0 ? `🌇 מרפסת: ${property.שטח_מרפסת} מ"ר` : ''}
${property.שטח_גינה > 0 ? `🌳 גינה: ${property.שטח_גינה} מ"ר` : ''}
🚗 חניה: ${property.סוג_חניה}, ${property.כמות_חניות} מקומות
💰 מחיר מבוקש: ${property.מחיר_מבוקש.toLocaleString('he-IL')} ₪
${property.pdfLink !== '#' ? `📄 תכנית דירה: ${property.pdfLink}` : ''}
───────────────────────────────────────────────────────────────

`).join('')}
═══════════════════════════════════════════════════════════════

אשמח לתאם צפייה בנכסים שמעניינים אותך.

בברכה,
צוות HomeMarket

📞 טלפון: 03-1234567
🌐 אתר: www.homemarket.co.il
⚡ נתונים חיים מעודכנים | שירות מקצועי ואמין`;

    try {
      const mailtoUrl = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Check if URL is too long (most email clients have ~2000 char limit)
      if (mailtoUrl.length > 2000) {
        // Fallback: copy text to clipboard and show instructions
        const fullEmailContent = `נושא: ${subject}

${emailBody}`;
        
        navigator.clipboard.writeText(fullEmailContent).then(() => {
          alert('תוכן המייל הועתק ללוח! פתח את תוכנת המייל שלך והדבק את התוכן.');
        }).catch(() => {
          // If clipboard fails, show the content in a new window
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(`<pre dir="rtl" style="font-family: Arial; text-align: right; white-space: pre-wrap; direction: rtl;">${fullEmailContent}</pre>`);
            newWindow.document.close();
          }
        });
      } else {
        window.open(mailtoUrl);
      }
    } catch (error) {
      alert('שגיאה בשליחת המייל. נסה שוב או העתק את הפרטים ידנית.');
      console.error('Email error:', error);
    }
  };

  const printList = () => {
    const printContent = `
      <html>
        <head>
          <title>רשימת נכסים מתאימים - HomeMarket</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3366FF; padding-bottom: 20px; }
            .client-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
            .property { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .property-title { font-size: 18px; font-weight: bold; color: #3366FF; margin-bottom: 10px; }
            .property-details { line-height: 1.6; }
            .price { font-size: 16px; font-weight: bold; color: #2952CC; }
            .footer { margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HomeMarket - מנוע חיפוש נכסים</h1>
            <h2>רשימת נכסים מתאימים</h2>
          </div>
          
          <div class="client-info">
            <strong>פרטי לקוח:</strong><br>
            שם: ${clientName || 'לא צוין'}<br>
            טלפון: ${clientPhone || 'לא צוין'}<br>
            מייל: ${clientEmail || 'לא צוין'}<br>
            תאריך: ${new Date().toLocaleDateString('he-IL')}
          </div>

          ${selectedProperties.map((property, index) => `
            <div class="property">
              <div class="property-title">${index + 1}. נכס מספר ${index + 1}</div>
              <div class="property-details">
                <strong>📍 מיקום:</strong> ${property.רחוב} ${property.מספר_בניין}, ${property.שכונה}, ${property.עיר}<br>
                <strong>🏢 פרויקט:</strong> ${property.שם_הנכס_שיוצג_באתר}<br>
                <strong>🏠 סוג נכס:</strong> ${property.סוג_נכס} | קומה ${property.קומה} | דירה מס' ${property.מספר_דירה}<br>
                <strong>🛏 מספר חדרים:</strong> ${property.מספר_חדרים}<br>
                <strong>📐 שטח דירה:</strong> ${property.שטח_דירה} מ"ר<br>
                ${property.שטח_מרפסת > 0 ? `<strong>מרפסת:</strong> ${property.שטח_מרפסת} מ"ר<br>` : ''}
                ${property.שטח_גינה > 0 ? `<strong>גינה:</strong> ${property.שטח_גינה} מ"ר<br>` : ''}
                <strong>🚗 חניה:</strong> ${property.סוג_חניה}, ${property.כמות_חניות} מקומות<br>
                <div class="price">💰 מחיר מבוקש: ${property.מחיר_מבוקש.toLocaleString('he-IL')} ₪</div>
              </div>
            </div>
          `).join('')}

          <div class="footer">
            <strong>HomeMarket</strong><br>
            טלפון: 03-1234567 | אתר: www.homemarket.co.il<br>
            נתונים חיים מעודכנים | שירות מקצועי ואמין
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (selectedProperties.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isExpanded && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-3 min-w-[350px] max-w-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#222222] flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              נכסים ללקוח
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              נבחרו {selectedProperties.length} נכסים מתאימים
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="שם הלקוח"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3366FF] focus:border-transparent text-sm"
              />
              
              <input
                type="tel"
                placeholder="טלפון לקוח (לוואטסאפ)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3366FF] focus:border-transparent text-sm"
              />
              
              <input
                type="email"
                placeholder="מייל לקוח"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3366FF] focus:border-transparent text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={sendWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                שלח בוואטסאפ
              </button>
              
              <button
                onClick={sendEmail}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                שלח במייל
              </button>
              
              <button
                onClick={printList}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Printer className="w-4 h-4" />
                הדפס לפגישה
              </button>
            </div>

            <button
              onClick={onClearSelections}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              נקה בחירות
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
      >
        <Heart className="w-6 h-6" />
        {selectedProperties.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#F4E851] text-[#222222] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {selectedProperties.length}
          </span>
        )}
      </button>
    </div>
  );
};

export default ClientSelectionPanel;