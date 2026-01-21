import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Key, Shield, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { saveApiKey } from '@/services/ai-service';

interface SettingsDialogProps {
  onClose?: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    // Load API key from localStorage when dialog opens
    if (open) {
      const storedKey = localStorage.getItem('openrouter_api_key') || '';
      setApiKey(storedKey);
    }
  }, [open]);

  const handleSave = () => {
    if (apiKey.trim()) {
      saveApiKey(apiKey.trim());
      toast.success('API key saved successfully');
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
        className="h-10 w-10 rounded-xl text-gray-600 hover:text-emerald-600 hover:bg-emerald-500/10 dark:text-gray-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all duration-200"
      >
        <Settings size={20} />
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <Settings className="w-5 h-5 text-emerald-500" />
              Settings
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Configure your OpenRouter API key for GPT access
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            {/* API Key Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                <Label htmlFor="apiKey" className="text-sm font-medium text-gray-900 dark:text-white">
                  OpenRouter API Key
                </Label>
              </div>
              
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full h-12 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
              />
              
              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <Shield className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your API key is stored locally in your browser and never sent to our servers.
                </p>
              </div>
            </div>

            {/* Get API Key Link */}
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 group"
            >
              <span className="text-sm">Get your API key at OpenRouter</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </a>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="rounded-xl border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
