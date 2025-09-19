import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tool } from "@shared/schema";

interface ToolsCarouselProps {
  featured?: boolean;
  limit?: number;
  className?: string;
}

export function ToolsCarousel({ featured = true, limit, className }: ToolsCarouselProps) {
  // Build query string for the API endpoint
  const params = new URLSearchParams();
  if (featured !== undefined) params.append("featured", featured.toString());
  if (limit) params.append("limit", limit.toString());
  const queryString = params.toString();
  const apiUrl = queryString ? `/api/tools?${queryString}` : "/api/tools";

  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: [apiUrl],
  });

  if (isLoading) {
    return (
      <div className="w-full" data-testid="tools-carousel-loading">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse" data-testid={`skeleton-tool-${i}`}>
              <CardContent className="p-6 flex flex-col items-center space-y-4">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-3 w-12 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!tools.length) {
    return (
      <div className="text-center py-8" data-testid="tools-carousel-empty">
        <p className="text-muted-foreground">Nenhuma ferramenta encontrada.</p>
      </div>
    );
  }

  return (
    <div className={className} data-testid="tools-carousel">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {tools.map((tool) => (
            <ToolCarouselItem key={tool.id} tool={tool} />
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" data-testid="carousel-previous" />
        <CarouselNext className="hidden sm:flex" data-testid="carousel-next" />
      </Carousel>
    </div>
  );
}

interface ToolCarouselItemProps {
  tool: Tool;
}

function ToolCarouselItem({ tool }: ToolCarouselItemProps) {
  const [imageError, setImageError] = useState(false);

  const handleToolClick = () => {
    if (tool.website) {
      window.open(tool.website, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <CarouselItem className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
      <Card 
        className={`group hover:scale-105 transition-transform duration-200 glass-morphism ${
          tool.website ? 'cursor-pointer' : ''
        }`}
        onClick={handleToolClick}
        data-testid={`card-tool-${tool.id}`}
      >
        <CardContent className="p-6 flex flex-col items-center space-y-4">
          {/* Tool Icon */}
          <div className="relative">
            {tool.iconUrl && !imageError ? (
              <img
                src={tool.iconUrl}
                alt={`${tool.name} icon`}
                className="w-12 h-12 object-contain"
                onError={() => setImageError(true)}
                data-testid={`img-tool-${tool.id}`}
              />
            ) : (
              <div 
                className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold text-lg"
                data-testid={`fallback-tool-${tool.id}`}
              >
                {tool.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Tool Name */}
          <div className="text-center space-y-2">
            <h3 
              className="font-semibold text-sm leading-tight" 
              data-testid={`text-tool-name-${tool.id}`}
            >
              {tool.name}
            </h3>
            
            {/* Category Badge */}
            {tool.category && (
              <Badge 
                variant="secondary" 
                className="text-xs"
                data-testid={`badge-tool-category-${tool.id}`}
              >
                {tool.category}
              </Badge>
            )}
          </div>

          {/* External Link on Hover */}
          {tool.website && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
                data-testid={`link-tool-website-${tool.id}`}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Visitar site do {tool.name}</span>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </CarouselItem>
  );
}