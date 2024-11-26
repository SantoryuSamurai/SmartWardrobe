import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface StyleAssistantModalProps {
  chatbotUrl?: string;
}

const StyleAssistantModal: React.FC<StyleAssistantModalProps> = ({ 
  chatbotUrl = 'https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2024/11/19/03/20241119030807-4TNHTARG.json' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenChat}
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        Style Assistant
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] h-[600px] p-0 overflow-hidden">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={handleCloseChat}
            >
              <X className="h-6 w-6" />
            </Button>
            <iframe
              src={chatbotUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Style Assistant"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StyleAssistantModal;