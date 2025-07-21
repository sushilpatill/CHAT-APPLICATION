import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileText, Users } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      toast.error("Failed to fetch documents");
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!newDocTitle.trim()) return;

    try {
      // Generate a random user ID for demo purposes
      const userId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            title: newDocTitle,
            created_by: userId,
            content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Start typing..."}]}]}
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setNewDocTitle("");
      setDialogOpen(false);
      toast.success("Document created successfully!");
      
      // Navigate to the new document
      navigate(`/editor/${data.id}`);
    } catch (error) {
      toast.error("Failed to create document");
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Document Editor</h1>
            <p className="text-muted-foreground">Create and collaborate on documents in real-time</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createDocument()}
                />
                <Button onClick={createDocument} className="w-full">
                  Create Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {documents.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first collaborative document to get started
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Document
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={`/editor/${doc.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5" />
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Collaborative Document
                      </div>
                      <div>
                        Created: {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        Updated: {new Date(doc.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}