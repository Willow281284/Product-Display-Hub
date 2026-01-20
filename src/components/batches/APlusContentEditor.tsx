import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  File,
  Trash2,
  GripVertical,
  Upload,
  Link,
  Type,
  Loader2,
  Eye,
  X,
} from 'lucide-react';

interface ContentModule {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'file';
  content: string; // For text, this is the text content. For media, this is the URL
  caption?: string;
  filename?: string;
}

interface APlusContentEditorProps {
  value: string; // JSON string of ContentModule[]
  onChange: (value: string) => void;
  batchItemId: string;
}

const MODULE_TYPES = [
  { type: 'text', label: 'Text Block', icon: Type, color: 'text-blue-500' },
  { type: 'image', label: 'Image', icon: ImageIcon, color: 'text-green-500' },
  { type: 'video', label: 'Video', icon: Video, color: 'text-purple-500' },
  { type: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-red-500' },
  { type: 'file', label: 'Other File', icon: File, color: 'text-orange-500' },
] as const;

export function APlusContentEditor({ value, onChange, batchItemId }: APlusContentEditorProps) {
  const [modules, setModules] = useState<ContentModule[]>(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  });
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const updateModules = (newModules: ContentModule[]) => {
    setModules(newModules);
    onChange(JSON.stringify(newModules));
  };

  const addModule = (type: ContentModule['type']) => {
    const newModule: ContentModule = {
      id: crypto.randomUUID(),
      type,
      content: '',
      caption: '',
    };
    updateModules([...modules, newModule]);
    setShowAddMenu(false);
  };

  const removeModule = (id: string) => {
    updateModules(modules.filter(m => m.id !== id));
  };

  const updateModule = (id: string, updates: Partial<ContentModule>) => {
    updateModules(modules.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleFileUpload = async (moduleId: string, file: File) => {
    setUploadingId(moduleId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${batchItemId}/${moduleId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      updateModule(moduleId, { 
        content: publicUrl, 
        filename: file.name 
      });
      
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingId(null);
    }
  };

  const handleUrlInput = (moduleId: string, url: string) => {
    updateModule(moduleId, { content: url });
  };

  const getModuleIcon = (type: ContentModule['type']) => {
    const config = MODULE_TYPES.find(m => m.type === type);
    return config ? config.icon : File;
  };

  const getModuleColor = (type: ContentModule['type']) => {
    const config = MODULE_TYPES.find(m => m.type === type);
    return config ? config.color : 'text-muted-foreground';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">A+ Content Modules</h4>
          <p className="text-sm text-muted-foreground">
            Add rich content blocks to enhance your product listing
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          {modules.length} module{modules.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Modules List */}
      <ScrollArea className="max-h-[400px]">
        <div className="space-y-3 pr-4">
          {modules.map((module, index) => {
            const ModuleIcon = getModuleIcon(module.type);
            const isUploading = uploadingId === module.id;

            return (
              <Card key={module.id} className="relative group">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-muted", getModuleColor(module.type))}>
                      <ModuleIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {MODULE_TYPES.find(m => m.type === module.type)?.label}
                        <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => removeModule(module.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-4 px-4">
                  {module.type === 'text' ? (
                    <Textarea
                      value={module.content}
                      onChange={(e) => updateModule(module.id, { content: e.target.value })}
                      placeholder="Enter your text content here..."
                      className="min-h-[100px] resize-none"
                    />
                  ) : (
                    <div className="space-y-3">
                      {/* Preview */}
                      {module.content && (
                        <div className="relative rounded-lg border bg-muted/30 p-3">
                          {module.type === 'image' && (
                            <img 
                              src={module.content} 
                              alt={module.caption || 'A+ Content image'} 
                              className="max-h-[150px] rounded-lg object-contain mx-auto"
                            />
                          )}
                          {module.type === 'video' && (
                            <video 
                              src={module.content} 
                              controls 
                              className="max-h-[150px] rounded-lg mx-auto"
                            />
                          )}
                          {(module.type === 'pdf' || module.type === 'file') && (
                            <div className="flex items-center gap-3 p-2">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {module.filename || 'Uploaded file'}
                                </p>
                                <a 
                                  href={module.content} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> View file
                                </a>
                              </div>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 bg-background/80"
                            onClick={() => updateModule(module.id, { content: '', filename: '' })}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {/* Upload / URL Input */}
                      {!module.content && (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="file"
                              accept={
                                module.type === 'image' ? 'image/*' :
                                module.type === 'video' ? 'video/*' :
                                module.type === 'pdf' ? '.pdf' : '*'
                              }
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(module.id, file);
                              }}
                              className="opacity-0 absolute inset-0 cursor-pointer"
                              disabled={isUploading}
                            />
                            <Button variant="outline" className="w-full gap-2" disabled={isUploading}>
                              {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              {isUploading ? 'Uploading...' : 'Upload File'}
                            </Button>
                          </div>
                          <span className="text-sm text-muted-foreground">or</span>
                          <div className="flex-1">
                            <div className="relative">
                              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Paste URL..."
                                className="pl-9"
                                onBlur={(e) => handleUrlInput(module.id, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Caption */}
                      <Input
                        value={module.caption || ''}
                        onChange={(e) => updateModule(module.id, { caption: e.target.value })}
                        placeholder="Add a caption (optional)"
                        className="text-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {modules.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No content modules yet</p>
              <p className="text-xs text-muted-foreground">Click "Add Module" to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add Module Button */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus className="w-4 h-4" />
          Add Module
        </Button>

        {showAddMenu && (
          <Card className="absolute bottom-full left-0 right-0 mb-2 z-10 shadow-lg">
            <CardContent className="p-2 grid grid-cols-2 gap-1">
              {MODULE_TYPES.map(({ type, label, icon: Icon, color }) => (
                <Button
                  key={type}
                  variant="ghost"
                  className="justify-start gap-2 h-auto py-2"
                  onClick={() => addModule(type)}
                >
                  <div className={cn("w-6 h-6 rounded flex items-center justify-center bg-muted", color)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{label}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}