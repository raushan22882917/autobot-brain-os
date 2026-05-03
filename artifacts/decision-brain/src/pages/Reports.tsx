import { useState } from "react";
import { useListReports, useGenerateReport, getListReportsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Calendar, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const { data: reports, isLoading } = useListReports();
  const generateMutation = (useGenerateReport as any)(); // Typings may vary
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("board_briefing");

  const handleGenerate = () => {
    generateMutation.mutate({ data: { reportType, decisionIds: [] } }, {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
      }
    });
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'board_briefing': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'weekly': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pattern_analysis': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Intelligence Reports</h1>
          <p className="text-muted-foreground mt-2">
            AI-synthesized summaries for board meetings, stakeholders, and personal review.
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Generate Intelligence Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-input border-border text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-white">
                    <SelectItem value="board_briefing">Board Briefing</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="pattern_analysis">Pattern Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {generateMutation.isPending ? "Generating..." : "Generate AI Report"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 bg-white/5" />)}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report: any) => (
            <Card key={report.id} className="bg-card border-border hover:border-primary/50 transition-colors flex flex-col group cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={getReportTypeColor(report.reportType)}>
                    {report.reportType.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg text-white leading-tight">
                  {report.title || "Intelligence Report"}
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  Generated {new Date(report.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-card border border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No reports generated</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Synthesize your decision history into shareable intelligence briefs.
          </p>
          <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Generate First Report
          </Button>
        </div>
      )}
    </div>
  );
}