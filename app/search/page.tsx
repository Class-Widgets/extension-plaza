import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen max-w-6xl mx-auto px-4 py-8" />}>
      <SearchClient />
    </Suspense>
  );
}
