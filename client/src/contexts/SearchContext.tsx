/**
 * SearchContext.tsx — Shares the current search results across the component tree.
 *
 * Home.tsx sets nearbyBusinesses whenever a search completes.
 * Layout.tsx reads them and passes them into HelpPanel so the AI
 * can see and recommend the businesses the user is actually looking at.
 */

import { createContext, useContext, useState, useCallback } from "react";

export interface NearbyBusiness {
  name: string;
  categories: string;
  rating: number;
  distance?: number;
  hasDeals?: boolean;
}

interface SearchContextValue {
  nearbyBusinesses: NearbyBusiness[];
  setNearbyBusinesses: (businesses: NearbyBusiness[]) => void;
}

const SearchContext = createContext<SearchContextValue>({
  nearbyBusinesses: [],
  setNearbyBusinesses: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [nearbyBusinesses, setNearbyBusinessesState] = useState<NearbyBusiness[]>([]);

  const setNearbyBusinesses = useCallback((businesses: NearbyBusiness[]) => {
    setNearbyBusinessesState(businesses.slice(0, 8));
  }, []);

  return (
    <SearchContext.Provider value={{ nearbyBusinesses, setNearbyBusinesses }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  return useContext(SearchContext);
}
