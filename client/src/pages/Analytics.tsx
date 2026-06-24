/**
 * Analytics.tsx — Community activity insights dashboard.
 *
 * Features:
 *  - Date range filter (7 days, 30 days, all time)
 *  - Summary stat cards (reviews, businesses, favorites, avg rating)
 *  - Review activity area chart (reviews over time)
 *  - Favorites by category donut/pie chart
 *  - Top-rated businesses table with rank badges
 *  - CSV export of all analytics data
 *
 * Charts powered by Recharts (responsive, interactive).
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BarChart3, Download, Star, Heart, Building2, MessageSquare } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// Violet/indigo color palette for pie chart segments
const COLORS = ["#8b5cf6", "#6366f1", "#a78bfa", "#c084fc", "#e879f9", "#818cf8", "#7c3aed", "#4f46e5", "#9333ea", "#6d28d9"];

type DateRange = "7d" | "30d" | "all";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery({ dateRange });
  const { data: reviewsByDate, isLoading: reviewsLoading } = trpc.analytics.reviewsByDate.useQuery({ dateRange });
  const { data: categoryData, isLoading: categoryLoading } = trpc.analytics.categoryBreakdown.useQuery();
  const { data: topRated } = trpc.analytics.topRated.useQuery({ limit: 10 });

  /** Builds and downloads a CSV file containing all analytics data */
  const handleExportCSV = () => {
    if (!reviewsByDate || !categoryData) return;

    let csv = "Section,Field,Value\n";

    if (summary) {
      csv += `Summary,Total Reviews,${summary.totalReviews}\n`;
      csv += `Summary,Total Businesses,${summary.totalBusinesses}\n`;
      csv += `Summary,Total Favorites,${summary.totalFavorites}\n`;
      csv += `Summary,Average Rating,${summary.avgRating}\n`;
    }

    csv += "\nDate,Review Count\n";
    for (const row of reviewsByDate) {
      csv += `${row.date},${row.count}\n`;
    }

    csv += "\nCategory,Favorite Count\n";
    for (const row of categoryData) {
      csv += `${row.category},${row.count}\n`;
    }

    if (topRated) {
      csv += "\nBusiness,Rating,Reviews\n";
      for (const biz of topRated) {
        csv += `"${biz.name}",${(biz.rating / 10).toFixed(1)},${biz.reviewCount}\n`;
      }
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizbloom-analytics-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const STAT_CARDS = [
    { icon: MessageSquare, label: "Total Reviews", value: summary?.totalReviews ?? 0, gradient: "from-violet-500 to-indigo-500", bg: "bg-violet-50" },
    { icon: Building2, label: "Businesses", value: summary?.totalBusinesses ?? 0, gradient: "from-indigo-500 to-purple-500", bg: "bg-indigo-50" },
    { icon: Heart, label: "Total Favorites", value: summary?.totalFavorites ?? 0, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-50" },
    { icon: Star, label: "Avg Rating", value: summary?.avgRating ?? 0, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header-purple text-white py-14">
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Analytics</h1>
              <p className="text-violet-200 mt-1">Community activity insights and reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <label htmlFor="date-range" className="text-sm font-medium text-gray-600">
              Date Range
            </label>
            <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
              <SelectTrigger className="w-48 rounded-xl" id="date-range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 rounded-xl">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {summaryLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="rounded-2xl"><CardContent className="pt-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))
          ) : (
            STAT_CARDS.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="card-hover rounded-2xl border-0 shadow-md overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader>
              <CardTitle className="font-bold">Review Activity</CardTitle>
              <CardDescription>Reviews submitted over time</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : reviewsByDate && reviewsByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={reviewsByDate}>
                    <defs>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis allowDecimals={false} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#colorReviews)" name="Reviews" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No review data for this period
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-md">
            <CardHeader>
              <CardTitle className="font-bold">Favorites by Category</CardTitle>
              <CardDescription>Most favorited business categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : categoryData && categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={50}
                      label={({ category, count }) => `${category} (${count})`}
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No category data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Rated Table */}
        <Card className="rounded-2xl border-0 shadow-md">
          <CardHeader>
            <CardTitle className="font-bold">Top Rated Businesses</CardTitle>
            <CardDescription>Highest rated businesses in the community</CardDescription>
          </CardHeader>
          <CardContent>
            {topRated && topRated.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-violet-100">
                      <th className="text-left py-3 px-4 font-semibold text-gray-500">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500">Business</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500">City</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500">Rating</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-500">Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRated.map((biz: any, i: number) => (
                      <tr key={biz.id} className="border-b border-gray-50 hover:bg-violet-50/50 transition">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            i === 0 ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white" :
                            i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                            i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{biz.name}</td>
                        <td className="py-3 px-4 text-gray-500">{biz.city || "--"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-amber-700 text-sm">{(biz.rating / 10).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{biz.reviewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                No businesses data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
