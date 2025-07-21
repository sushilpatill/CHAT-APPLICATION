import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Users, Zap, Globe, ArrowRight, FileText, Edit } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-foreground mb-6">
            Collaborative Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Connect, collaborate, and create seamlessly with our modern platform.
            Experience real-time chat and collaborative document editing with beautiful design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Chatting
                <MessageCircle className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/documents">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Create Documents
                <Edit className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Real-Time Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Instant message delivery with real-time updates and seamless communication.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Document Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Collaborative document editing with real-time synchronization and multiple users.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Live Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                See other users' cursors and changes in real-time while working together.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Lightning Fast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Optimized performance with modern technologies for smooth experience.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Collaborating?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already collaborating and creating together.
            Start your journey with real-time communication and document collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat">
              <Button size="lg" variant="default">
                Try Chat Now
              </Button>
            </Link>
            <Link to="/documents">
              <Button size="lg" variant="outline">
                Create a Document
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;