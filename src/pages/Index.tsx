// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">Real-time Chat App</h1>
        <p className="text-xl text-muted-foreground mb-8">Connect and chat with others in real-time!</p>
        <a href="/chat" className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Enter Chat Room
        </a>
      </div>
    </div>
  );
};

export default Index;
