import React from 'react';
import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ title, text, url = window.location.href }) => {
  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `${text}\n\nVeja mais em Angolife Su-Golden:`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.title}\n${shareData.text}\n${shareData.url}`)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-1 text-xs font-bold text-brand-gold hover:text-amber-600 transition-all bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg gold-border-subtle"
      title="Partilhar no WhatsApp"
    >
      <Share2 size={14} />
      <span>Partilhar</span>
    </button>
  );
};