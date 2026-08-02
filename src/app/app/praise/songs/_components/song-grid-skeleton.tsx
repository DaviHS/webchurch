import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SongGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
      {[...Array(12)].map((_, i) => (
        <Card key={i} className="h-full animate-pulse">
          <CardHeader className="space-y-2 pb-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="space-y-2 pb-2">
            <div className="h-4 bg-muted rounded w-full"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}