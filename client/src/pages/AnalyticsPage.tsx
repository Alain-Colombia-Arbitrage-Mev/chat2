import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics } from "@/lib/api";
import { Loader2, MessageSquare, CheckCircle, Brain, BookOpen, HelpCircle } from "lucide-react";

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    refetchInterval: 30000, // Refresh every 30s
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
          Failed to load analytics
        </div>
      </AppLayout>
    );
  }

  const successRate = data.totalSessions > 0
    ? Math.round((data.successfullyAnswered / data.totalSessions) * 100)
    : 0;

  const confidenceColor = data.averageConfidence >= 0.7
    ? "text-emerald-400"
    : data.averageConfidence >= 0.4
    ? "text-amber-400"
    : "text-red-400";

  const confidenceBarColor = data.averageConfidence >= 0.7
    ? "bg-emerald-500"
    : data.averageConfidence >= 0.4
    ? "bg-amber-500"
    : "bg-red-500";

  const maxDailyCount = Math.max(...(data.dailySessions.map((d) => d.count) || [1]), 1);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl tracking-tight">Analytics</h2>
          <p className="text-muted-foreground text-sm mt-2">
            Chat performance and knowledge base coverage
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sessions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalSessions}</div>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>Admin: {data.adminSessions}</span>
                <span>Widget: {data.widgetSessions}</span>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Answer Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.totalSessions > 0 ? `${successRate}%` : "\u2014"}
              </div>
              <div className="flex gap-3 mt-1 text-xs">
                <span className="text-emerald-400">{data.successfullyAnswered} answered</span>
                <span className="text-red-400">{data.notAnswered} unanswered</span>
              </div>
            </CardContent>
          </Card>

          {/* Avg Confidence */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Avg Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${confidenceColor}`}>
                {data.totalSessions > 0 ? `${Math.round(data.averageConfidence * 100)}%` : "\u2014"}
              </div>
              <div className="mt-2 h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${confidenceBarColor}`}
                  style={{ width: `${Math.round(data.averageConfidence * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.totalFaqs + data.totalDocuments + data.totalScrapedUrls}
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>{data.totalFaqs} FAQs</span>
                <span>{data.totalDocuments} docs</span>
                <span>{data.totalScrapedUrls} URLs</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Unanswered Questions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Unanswered Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Open</div>
                  <div className="text-2xl font-bold text-amber-400">{data.unansweredOpen}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                  <div className="text-2xl font-bold text-emerald-400">{data.unansweredResolved}</div>
                </div>
              </div>
              {(data.unansweredOpen + data.unansweredResolved) > 0 && (
                <div className="mt-3 h-2 bg-muted-foreground/20 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-amber-500 rounded-l-full"
                    style={{
                      width: `${(data.unansweredOpen / (data.unansweredOpen + data.unansweredResolved)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-emerald-500 rounded-r-full"
                    style={{
                      width: `${(data.unansweredResolved / (data.unansweredOpen + data.unansweredResolved)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Sessions Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Daily Sessions (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailySessions.length === 0 ? (
                <div className="text-sm text-muted-foreground py-8 text-center">
                  No session data yet
                </div>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {data.dailySessions.map((day) => (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col justify-end group relative"
                      title={`${day.date}: ${day.count} sessions (${day.answered} answered, ${day.notAnswered} unanswered)`}
                    >
                      <div
                        className="flex flex-col justify-end"
                        style={{
                          height: `${(day.count / maxDailyCount) * 100}%`,
                          minHeight: day.count > 0 ? "4px" : "0",
                        }}
                      >
                        {day.notAnswered > 0 && (
                          <div
                            className="bg-red-500/80 rounded-t-sm"
                            style={{
                              height: `${(day.notAnswered / day.count) * 100}%`,
                              minHeight: "2px",
                            }}
                          />
                        )}
                        {day.answered > 0 && (
                          <div
                            className="bg-emerald-500/80 rounded-t-sm"
                            style={{
                              height: `${(day.answered / day.count) * 100}%`,
                              minHeight: "2px",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                {data.dailySessions.length > 0 && (
                  <>
                    <span>{data.dailySessions[0]?.date?.slice(5)}</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Answered
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Unanswered
                      </span>
                    </span>
                    <span>{data.dailySessions[data.dailySessions.length - 1]?.date?.slice(5)}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
