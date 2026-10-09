import { Suspense } from 'react';
import { TravelerNav } from '@/app/components/TravelerNav';
import { SearchBar } from '@/app/components/SearchBar';
import { SearchResults } from './components/SearchResults';

type SearchPageProps = {
  searchParams: Promise<{
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
  }>;
};

// Inner async component that reads searchParams (kept inside Suspense)
async function SearchPageContent({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const destination = params.destination ?? '';
  const checkIn = params.checkIn ?? '';
  const checkOut = params.checkOut ?? '';
  const guests = params.guests ? parseInt(params.guests, 10) : 1;

  return (
    <>
      {/* Search bar strip */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--tp-border)',
          padding: '1rem 1.5rem',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SearchBar
            initialDestination={destination}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialGuests={guests}
          />
        </div>
      </div>
      {/* Results */}
      <SearchResults
        destination={destination}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
      />
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <main style={{ background: 'var(--tp-bg)', minHeight: '100vh' }}>
      <TravelerNav />
      {/* Spacer for fixed nav */}
      <div style={{ height: '64px' }} />
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 1rem',
              color: 'var(--tp-secondary)',
              fontSize: '0.875rem',
            }}
          >
            Loading results…
          </div>
        }
      >
        <SearchPageContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
