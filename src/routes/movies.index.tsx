import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Film, Search } from "lucide-react";
import { MovieCard } from "@/components/MovieCard";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/movies/")({
  head: () => ({
    meta: [
      { title: "Movie Catalogue — CineDesk Booking Management" },
      {
        name: "description",
        content: "Browse active movies with genre, language, duration, rating and the number of available shows.",
      },
      { property: "og:title", content: "Movie Catalogue — CineDesk" },
      { property: "og:description", content: "Browse movies and available Premium and Standard shows." },
    ],
  }),
  component: MovieCatalogue,
});

function MovieCatalogue() {
  const { movies, shows } = useStore();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [genre, setGenre] = useState("all");

  const languages = useMemo(() => [...new Set(movies.map((m) => m.language))].sort(), [movies]);
  const genres = useMemo(() => [...new Set(movies.map((m) => m.genre))].sort(), [movies]);

  const filtered = movies.filter((m) => {
    const matchQuery = m.movieName.toLowerCase().includes(query.trim().toLowerCase());
    const matchLang = language === "all" || m.language === language;
    const matchGenre = genre === "all" || m.genre === genre;
    return matchQuery && matchLang && matchGenre;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Movie Catalogue</h1>
        <p className="text-sm text-muted-foreground">
          {movies.length} movies · {shows.length} scheduled shows across all theatres.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies by name"
            className="pl-9"
            aria-label="Search movies"
          />
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="sm:w-44" aria-label="Filter by language">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by genre">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genres</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Film className="size-6" />}
            title="No movies match your filters"
            description="Try clearing the search box or selecting a different language or genre."
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((movie) => (
            <MovieCard
              key={movie.movieId}
              movie={movie}
              showCount={shows.filter((s) => s.movieId === movie.movieId && s.status !== "Cancelled").length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
