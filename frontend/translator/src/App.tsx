import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, ArrowRightLeft, Copy, Check, Sparkles, Volume2, History, Trash2 } from 'lucide-react';
import axios from 'axios';

type Language = 'Thai' | 'English';

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('English');
  const [targetLang, setTargetLang] = useState<Language>('Thai');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/ai/translate`, {
        text: sourceText,
        targetLanguage: targetLang
      });
      setTranslatedText(response.data);
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText('Error: Could not connect to translation server.');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 sm:p-12">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl premium-gradient flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Languages size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">456 AI Translator</h1>
            <p className="text-gray-400 max-w-md mx-auto">ระบบแปลภาษาด้วย AI ระดับพรีเมียม ระหว่างภาษาไทยและอังกฤษ แม่นยำ รวดเร็ว และเป็นธรรมชาติ</p>
          </div>
        </div>

        {/* Translator Main Card */}
        <div className="translator-card grid grid-cols-1 md:grid-cols-2 group">
          {/* Source Panel */}
          <div className="p-6 sm:p-8 flex flex-col space-y-4 border-b md:border-b-0 md:border-r border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-indigo-400 tracking-widest uppercase">{sourceLang === 'Thai' ? 'ภาษาไทย' : 'English'}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSourceText('')}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <div className="p-2 text-gray-500"><Volume2 size={18} /></div>
              </div>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="กรอกข้อความที่ต้องการแปล..."
              className="w-full h-[200px] sm:h-[300px] bg-transparent resize-none text-xl sm:text-2xl font-medium focus:outline-none placeholder:text-gray-700 no-scrollbar"
            />
          </div>

          {/* Controls Intermediary (for mobile/desktop layout) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center z-10 pointer-events-none">
            <motion.button 
              whileHover={{ rotate: 180, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={swapLanguages}
              className="w-12 h-12 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-xl pointer-events-auto"
            >
              <ArrowRightLeft size={20} />
            </motion.button>
          </div>

          {/* Target Panel */}
          <div className="p-6 sm:p-8 flex flex-col space-y-4 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-purple-400 tracking-widest uppercase">{targetLang === 'Thai' ? 'ภาษาไทย' : 'English'}</span>
              <div className="flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  disabled={!translatedText}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-indigo-400 transition-colors disabled:opacity-30"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
                <div className="p-2 text-gray-500"><Volume2 size={18} /></div>
              </div>
            </div>
            <div className="w-full h-[200px] sm:h-[300px] text-xl sm:text-2xl font-medium overflow-y-auto no-scrollbar relative">
              <AnimatePresence mode="wait">
                {isTranslating ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full space-y-4 text-gray-600"
                  >
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <Sparkles size={40} />
                    </motion.div>
                    <p className="text-sm animate-pulse">กำลังแปลด้วย Gemini AI...</p>
                  </motion.div>
                ) : (
                  <motion.p 
                    key={translatedText}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={translatedText ? "text-white" : "text-gray-700"}
                  >
                    {translatedText || "คำแปลจะปรากฏที่นี่..."}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <History size={16} /> <span>ประวัติการแปล</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-800" />
            <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
              <Sparkles size={16} /> <span>ฟีเจอร์ระดับโปร</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="w-full sm:w-auto px-12 py-4 rounded-2xl premium-gradient text-white font-black text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            เริ่มการแปล
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
