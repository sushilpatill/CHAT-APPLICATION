-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policies for document access
CREATE POLICY "Documents are viewable by everyone" 
ON public.documents 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update documents" 
ON public.documents 
FOR UPDATE 
USING (true);

-- Create document operations table for real-time collaboration
CREATE TABLE public.document_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  operation JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for document operations
CREATE POLICY "Document operations are viewable by everyone" 
ON public.document_operations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create document operations" 
ON public.document_operations 
FOR INSERT 
WITH CHECK (true);

-- Create user presence table for collaborative features
CREATE TABLE public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  cursor_position INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Create policies for user presence
CREATE POLICY "User presence is viewable by everyone" 
ON public.user_presence 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their presence" 
ON public.user_presence 
FOR ALL 
USING (true);

-- Enable realtime for all tables
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;

ALTER TABLE public.document_operations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.document_operations;

ALTER TABLE public.user_presence REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();