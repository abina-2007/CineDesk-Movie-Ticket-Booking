import { Link } from "@tanstack/react-router";
import { Clock, Film, Star } from "lucide-react";
import { Pill } from "./StatusBadge";
import { posterSrc } from "@/lib/posters";
import type { Movie } from "@/lib/types";

export function PosterImage({
  movie,
  className,
  eager = false,
}: {
  movie: Movie;
  className?: string | undefined;
  eager?: boolean | undefined;
}) {
  const src = posterSrc(movie.poster);
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-secondary ${className ?? ""}`}>
        <div className="px-4 text-center">
          <Film className="mx-auto size-8 text-primary/70" />
          <p className="mt-2 text-sm font-semibold text-foreground">{movie.movieName}</p>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${movie.movieName} movie poster`}
      width={640}
      height={960}
      loading={eager ? "eager" : "lazy"}
      className={className}
    />
  );
}

export function MovieCard({ movie, showCount }: { movie: Movie; showCount: number }) {
  return (
    <Link
      to="/movies/$movieId"
      params={{ movieId: movie.movieId }}
      className="group surface-panel overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-marquee"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <PosterImage
          movie={movie}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {movie.status === "Inactive" && <Pill tone="danger">Inactive</Pill>}
        </div>
        <div className="absolute right-3 top-3">
          <Pill tone="gold">
            <Star className="size-3 fill-current" /> {movie.rating.toFixed(1)}
          </Pill>
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="truncate text-base font-semibold text-foreground">{movie.movieName}</h3>
        <p className="text-xs text-muted-foreground">
          {movie.genre} • {movie.language}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {movie.duration} min
          </span>
          <Pill tone={showCount > 0 ? "success" : "neutral"}>{showCount} shows</Pill>
        </div>
      </div>
    </Link>
  );
}
