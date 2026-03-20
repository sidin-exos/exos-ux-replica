import { useState } from "react";
import { Users, Building2, FlaskConical, Search, RefreshCw, ThumbsUp, ThumbsDown, FileText, Database, Activity, Star, Download, Heart, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import StatCard from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalyticsDashboard, TimeRange } from "@/hooks/useAnalyticsDashboard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

const SkeletonBlock = ({ className = "h-28" }: { className?: string }) => (
  <Skeleton className={`rounded-xl ${className}`} />
);

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last month" },
  { value: "all", label: "All time" },
];

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const analytics = useAnalyticsDashboard(timeRange);

  const statCards = [
    { title: "Total Users", icon: Users, value: String(analytics.totalUsers) },
    { title: "Total Organizations", icon: Building2, value: String(analytics.totalOrgs) },
    { title: "Scenarios Run", icon: FlaskConical, value: String(analytics.totalScenarios) },
    { title: "Intel Queries", icon: Search, value: String(analytics.totalIntelQueries) },
    { title: "Satisfaction Rate", icon: Heart, value: `${analytics.satisfactionRate}%` },
  ];

  // Growth chart data
  const allMonths = new Set([
    ...analytics.userGrowth.map((g) => g.month),
    ...analytics.orgGrowth.map((g) => g.month),
  ]);
  const userMap = new Map(analytics.userGrowth.map((g) => [g.month, g.count]));
  const orgMap = new Map(analytics.orgGrowth.map((g) => [g.month, g.count]));
  const growthData = Array.from(allMonths)
    .sort()
    .map((month) => ({ month, users: userMap.get(month) || 0, orgs: orgMap.get(month) || 0 }));

  // Feedback distribution chart (1-10 scale)
  const ratingChartData = Array.from({ length: 10 }, (_, i) => i + 1).map((r) => ({
    rating: `${r}`,
    count: analytics.feedbackDistribution[r] || 0,
  }));

  return (
    <div className="min-h-screen gradient-hero">
      <Header />
      <main className="container max-w-7xl py-12 space-y-8">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Test Phase Analytics</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={analytics.exportRawData} disabled={analytics.isLoading}>
              <Download className="w-4 h-4 mr-1" />
              Export Raw Data
            </Button>
            <Button variant="outline" size="sm" onClick={analytics.refreshAll} disabled={analytics.isLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${analytics.isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top StatCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {analytics.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} />)
            : statCards.map((card) => (
                <StatCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
              ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="usage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usage">Usage & Performance</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          {/* Tab 1: Usage & Performance */}
          <TabsContent value="usage" className="space-y-6">
            {/* Time range selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Time range:</span>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {analytics.isLoading ? (
              <SkeletonBlock className="h-64" />
            ) : (
              <>
                {/* Scenario chart */}
                {analytics.scenarioBreakdown.length > 0 && (
                  <Card className="card-elevated">
                    <CardHeader>
                      <CardTitle className="text-lg">Scenario Runs by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.scenarioBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="type" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                          <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                          <Bar dataKey="count" name="Runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avgTokens" name="Avg Tokens" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Scenario Breakdown table */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Scenario Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Scenario Type</TableHead>
                          <TableHead className="text-right">Runs</TableHead>
                          <TableHead className="text-right">Success Rate</TableHead>
                          <TableHead className="text-right">Avg Time (ms)</TableHead>
                          <TableHead className="text-right">Avg Tokens</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.scenarioBreakdown.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No scenario data in this period</TableCell></TableRow>
                        ) : (
                          analytics.scenarioBreakdown.map((s) => (
                            <TableRow key={s.type}>
                              <TableCell className="font-medium">{s.type}</TableCell>
                              <TableCell className="text-right">{s.count}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={s.successRate >= 80 ? "default" : "destructive"}>{s.successRate}%</Badge>
                              </TableCell>
                              <TableCell className="text-right">{s.avgTimeMs.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{s.avgTokens.toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Industry Breakdown table */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Industry Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Industry</TableHead>
                          <TableHead className="text-right">Runs</TableHead>
                          <TableHead className="text-right">Success Rate</TableHead>
                          <TableHead className="text-right">Avg Time (ms)</TableHead>
                          <TableHead className="text-right">Avg Tokens</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.industryBreakdown.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No industry data in this period</TableCell></TableRow>
                        ) : (
                          analytics.industryBreakdown.map((s) => (
                            <TableRow key={s.industry}>
                              <TableCell className="font-medium">{s.industry}</TableCell>
                              <TableCell className="text-right">{s.count}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={s.successRate >= 80 ? "default" : "destructive"}>{s.successRate}%</Badge>
                              </TableCell>
                              <TableCell className="text-right">{s.avgTimeMs.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{s.avgTokens.toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Recent 20 Scenario Runs */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent 20 Scenario Runs</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Scenario Type</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Success</TableHead>
                          <TableHead className="text-right">Time (ms)</TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead>Model</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.recentRuns.length === 0 ? (
                          <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No runs in this period</TableCell></TableRow>
                        ) : (
                          analytics.recentRuns.map((run) => (
                            <TableRow key={run.id}>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(run.created_at).toLocaleString()}
                              </TableCell>
                              <TableCell className="font-medium">{run.scenario_type}</TableCell>
                              <TableCell className="max-w-[120px] truncate">{run.industry_slug || "—"}</TableCell>
                              <TableCell className="max-w-[120px] truncate">{run.category_slug || "—"}</TableCell>
                              <TableCell>
                                {run.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                              </TableCell>
                              <TableCell className="text-right">{run.processing_time_ms?.toLocaleString() ?? "—"}</TableCell>
                              <TableCell className="text-right">{run.total_tokens?.toLocaleString() ?? "—"}</TableCell>
                              <TableCell className="text-sm">{run.model}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Intel breakdown */}
                {analytics.intelBreakdown.length > 0 && (
                  <Card className="card-elevated">
                    <CardHeader>
                      <CardTitle className="text-lg">Intel Query Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Query Type</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">Success Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analytics.intelBreakdown.map((q) => (
                            <TableRow key={q.type}>
                              <TableCell className="font-medium">{q.type}</TableCell>
                              <TableCell className="text-right">{q.count}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={q.successRate >= 80 ? "default" : "destructive"}>{q.successRate}%</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab 2: Growth */}
          <TabsContent value="growth" className="space-y-6">
            {analytics.isLoading ? (
              <SkeletonBlock className="h-64" />
            ) : growthData.length > 0 ? (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Signups Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                      <YAxis className="fill-muted-foreground" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                      <Legend />
                      <Line type="monotone" dataKey="users" name="Users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="orgs" name="Organizations" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <Card className="card-elevated">
                <CardContent className="py-12 text-center text-muted-foreground">No growth data yet</CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Feedback */}
          <TabsContent value="feedback" className="space-y-6">
            {analytics.isLoading ? (
              <SkeletonBlock className="h-64" />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard title="Satisfaction Rate" value={`${analytics.satisfactionRate}%`} icon={Heart} />
                  <StatCard title="Average Rating" value={`${analytics.avgRating} / 10`} icon={Star} />
                  <StatCard title="Chat Thumbs Up" value={String(analytics.chatThumbsUp)} icon={ThumbsUp} />
                  <StatCard title="Chat Thumbs Down" value={String(analytics.chatThumbsDown)} icon={ThumbsDown} />
                </div>

                {ratingChartData.some((d) => d.count > 0) && (
                  <Card className="card-elevated">
                    <CardHeader>
                      <CardTitle className="text-lg">Scenario Rating Distribution (1-10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={ratingChartData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="rating" className="fill-muted-foreground" />
                          <YAxis className="fill-muted-foreground" allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                          <Bar dataKey="count" name="Responses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Latest Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rating</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.latestFeedback.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No feedback yet</TableCell></TableRow>
                        ) : (
                          analytics.latestFeedback.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell><Badge variant="outline">{f.rating}/10</Badge></TableCell>
                              <TableCell className="max-w-md truncate">{f.feedback_text || "—"}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tab 4: Assets */}
          <TabsContent value="assets" className="space-y-6">
            {analytics.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Files Uploaded" value={String(analytics.totalFiles)} icon={FileText} />
                <StatCard title="Market Insights Saved" value={String(analytics.totalInsights)} icon={Database} />
                <StatCard title="Active Trackers" value={String(analytics.totalTrackers)} icon={Activity} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
