export function SongDetailSkeleton() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
        <div className="h-8 bg-muted rounded-md animate-pulse w-48" />
      </div>
      
      <div className="grid gap-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-96 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}