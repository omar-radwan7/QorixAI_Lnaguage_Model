
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { saveApiKey, getCurrentProvider, setCurrentProvider } from '@/services/ai-service';

interface SettingsDialogProps {
  onClose?: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const [open, setOpen] = useState(false);
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'openrouter-qwen'>('openrouter-qwen');

  useEffect(() => {
    // Load API key from localStorage when the component mounts
    const storedOpenRouterApiKey = localStorage.getItem('qorix_openrouter_api_key') || '';
    
    setOpenRouterApiKey(storedOpenRouterApiKey);
    setSelectedProvider('openrouter-qwen'); // Default to Qwen since it's now the only option
  }, []);

  const handleSave = () => {
    if (openRouterApiKey.trim()) {
      saveApiKey(openRouterApiKey.trim(), 'openrouter');
      setCurrentProvider('openrouter-qwen');
      toast.success('OpenRouter API key saved successfully (Qwen model)');
      setOpen(false);
      if (onClose) onClose();
    } else {
      toast.error('Please enter a valid API key');
    }
  };

  return (
    <div className="flex items-center">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setOpen(true)}
        className="text-qorix-dark/70 hover:text-qorix-dark hover:bg-qorix-dark/5 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/5"
      >
        <Settings size={20} />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md dark:bg-[#1A1F2C] dark:text-[#d6bcfa] dark:border-[#3a3f4b]">
          <DialogHeader>
            <DialogTitle className="dark:text-[#9b87f5]">Settings</DialogTitle>
            <DialogDescription className="dark:text-[#d6bcfa]/70">
              Configure your Qorix AI settings and API keys
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mt-4">
              <Label htmlFor="openRouterApiKey" className="text-sm font-medium dark:text-[#d6bcfa]">
                OpenRouter API Key (Qwen model)
              </Label>
              <div className="mt-1">
                <Input
                  id="openRouterApiKey"
                  type="password"
                  value={openRouterApiKey}
                  onChange={(e) => setOpenRouterApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full dark:bg-[#282c34] dark:text-[#d6bcfa] dark:border-[#3a3f4b]"
                />
                <p className="mt-2 text-sm text-qorix-dark/60 dark:text-white/60">
                  Enter your OpenRouter API key. Your key should begin with "sk-or-v1-"
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="dark:bg-transparent dark:text-[#d6bcfa] dark:border-[#3a3f4b] dark:hover:bg-[#282c34]"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="dark:bg-[#7E69AB] dark:text-white dark:hover:bg-[#6E59A5]">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
