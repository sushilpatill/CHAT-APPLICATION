import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Users, Eye } from "lucide-react";
import { toast } from "sonner";

interface DocumentData {
  id: string;
  title: string;
  content: any;
  created_by: string;
  updated_at: string;
}

interface UserPresence {
  user_id: string;
  username: string;
  cursor_position: number;
  last_seen: string;
}

// Generate random user colors for collaboration
const getUserColor = (userId: string) => {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57",
    "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43"
  ];
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [currentUser] = useState({
    id: crypto.randomUUID(),
    name: `User_${Math.floor(Math.random() * 1000)}`
  });

  // Create Y.js document for real-time collaboration
  const [ydoc] = useState(() => new Y.Doc());

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: null,
        user: {
          name: currentUser.name,
          color: getUserColor(currentUser.id),
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[600px] p-6",
      },
    },
    onUpdate: ({ editor }) => {
      // Debounced save
      debouncedSave(editor.getJSON());
    },
  });

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (content: any) => {
      if (!id) return;
      await saveDocument(content);
    }, 1000),
    [id]
  );

  useEffect(() => {
    if (id) {
      fetchDocument();
      setupRealtimeSubscription();
      updateUserPresence();
    }

    return () => {
      // Cleanup user presence when leaving
      if (id) {
        removeUserPresence();
      }
    };
  }, [id]);

  const fetchDocument = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setDocument(data);
      setTitle(data.title);
      
      // Set editor content
      if (editor && data.content) {
        editor.commands.setContent(data.content as any);
      }
    } catch (error) {
      toast.error("Failed to load document");
      console.error('Error:', error);
    }
  };

  const saveDocument = async (content: any) => {
    if (!id || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Update local document state
      setDocument(prev => prev ? { ...prev, content, updated_at: new Date().toISOString() } : null);
    } catch (error) {
      toast.error("Failed to save document");
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveTitle = async () => {
    if (!id || !title.trim()) return;

    try {
      const { error } = await supabase
        .from('documents')
        .update({ title })
        .eq('id', id);

      if (error) throw error;
      toast.success("Title updated");
    } catch (error) {
      toast.error("Failed to update title");
      console.error('Error:', error);
    }
  };

  const updateUserPresence = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('user_presence')
        .upsert({
          document_id: id,
          user_id: currentUser.id,
          username: currentUser.name,
          cursor_position: 0,
          last_seen: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const removeUserPresence = async () => {
    if (!id) return;

    try {
      await supabase
        .from('user_presence')
        .delete()
        .eq('document_id', id)
        .eq('user_id', currentUser.id);
    } catch (error) {
      console.error('Error removing presence:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!id) return;

    // Subscribe to document changes
    const documentChannel = supabase
      .channel('document-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `id=eq.${id}`
        },
        (payload) => {
          const updatedDoc = payload.new as DocumentData;
          if (editor && updatedDoc.content) {
            // Only update if content is different to avoid conflicts
            const currentContent = JSON.stringify(editor.getJSON());
            const newContent = JSON.stringify(updatedDoc.content);
            if (currentContent !== newContent) {
              editor.commands.setContent(updatedDoc.content as any);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to user presence
    const presenceChannel = supabase
      .channel('user-presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `document_id=eq.${id}`
        },
        () => {
          fetchUserPresence();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(documentChannel);
      supabase.removeChannel(presenceChannel);
    };
  };

  const fetchUserPresence = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('document_id', id)
        .neq('user_id', currentUser.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching presence:', error);
    }
  };

  // Update presence periodically
  useEffect(() => {
    const interval = setInterval(updateUserPresence, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [id]);

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/documents">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
                  className="text-lg font-semibold border-none shadow-none focus:ring-0 p-0 h-auto"
                />
                {saving && <Badge variant="secondary">Saving...</Badge>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {users.length + 1} user{users.length !== 0 ? 's' : ''} online
                </span>
              </div>

              <div className="flex -space-x-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                  style={{ backgroundColor: getUserColor(currentUser.id) }}
                  title={currentUser.name}
                >
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                {users.slice(0, 3).map((user) => (
                  <div
                    key={user.user_id}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background"
                    style={{ backgroundColor: getUserColor(user.user_id) }}
                    title={user.username}
                  >
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {users.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                    +{users.length - 3}
                  </div>
                )}
              </div>

              <Button 
                onClick={() => editor && saveDocument(editor.getJSON())}
                disabled={saving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="min-h-[700px]">
          <EditorContent editor={editor} className="min-h-full" />
        </Card>
      </div>
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}