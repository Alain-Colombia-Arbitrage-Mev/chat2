import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ExternalLink } from "lucide-react";

/**
 * Email composer is not yet wired to the memory.ancestro.ai backend. The
 * legacy MJML/react-email-editor flow lived on a separate Express server that
 * we removed. To re-enable, ship a /api/email-editor endpoint + outbound SMTP
 * pipeline on the backend and bring back the editor component here.
 */
export default function EmailComposerPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Email composer</CardTitle>
            </div>
            <CardDescription>
              Send proposal emails from the chatbot.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This feature is not implemented in the current backend (
              <code className="bg-muted px-1 rounded">memory.ancestro.ai</code>).
            </p>
            <p>
              To re-enable, expose an{" "}
              <code className="bg-muted px-1 rounded">/api/email-editor</code>{" "}
              endpoint with SMTP delivery and restore the{" "}
              <code className="bg-muted px-1 rounded">react-email-editor</code>{" "}
              component.
            </p>
            <p className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <a
                href="https://github.com/unlayer/react-email-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                react-email-editor docs
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
