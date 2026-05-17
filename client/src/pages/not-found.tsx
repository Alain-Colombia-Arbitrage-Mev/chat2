import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl text-foreground tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground text-sm">
            The page you are looking for doesn't exist or has been moved. 
            Ensure you are using the correct tenant URL.
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button className="w-full">
                Return to Agent Configurator
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
