import { Catalog } from "@/components/catalog";

export const metadata = { title: "Movies" };

export default function MoviesPage() {
  return <Catalog kind="movie" />;
}
