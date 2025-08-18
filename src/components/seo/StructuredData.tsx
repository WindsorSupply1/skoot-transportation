export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "BusCompany",
    "name": "Skoot Transportation",
    "alternateName": "Skoot Shuttle",
    "url": "https://skoot.bike",
    "logo": "https://skoot.bike/logo.png",
    "description": "Hourly shuttle service from Columbia, SC to Charlotte Douglas International Airport",
    "priceRange": "$31-$35",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1224 Main Street",
      "addressLocality": "Columbia",
      "addressRegion": "SC",
      "postalCode": "29201",
      "addressCountry": "US"
    },
    "telephone": "+1-803-756-6687",
    "email": "hello@skoot.bike",
    "areaServed": [
      {
        "@type": "City",
        "name": "Columbia",
        "state": "South Carolina"
      },
      {
        "@type": "City",
        "name": "Charlotte",
        "state": "North Carolina"
      },
      {
        "@type": "City",
        "name": "Rock Hill",
        "state": "South Carolina"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Shuttle Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "name": "First 100 Customer Rate",
          "price": "31.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Regular One-Way",
          "price": "35.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          "name": "Student/Military Rate",
          "price": "32.00",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      ]
    }
  };

  const busRouteSchema = {
    "@context": "https://schema.org",
    "@type": "BusTrip",
    "provider": {
      "@type": "BusCompany",
      "name": "Skoot Transportation"
    },
    "departureBusStop": {
      "@type": "BusStop",
      "name": "Columbia Downtown",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1224 Main Street",
        "addressLocality": "Columbia",
        "addressRegion": "SC"
      }
    },
    "arrivalBusStop": {
      "@type": "BusStop",
      "name": "Charlotte Douglas International Airport",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "5501 Josh Birmingham Pkwy",
        "addressLocality": "Charlotte",
        "addressRegion": "NC"
      }
    },
    "busName": "Skoot Shuttle",
    "busNumber": "Columbia-CLT",
    "departureTime": "Multiple daily departures",
    "arrivalTime": "100-130 minutes after departure"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I book a ride with Skoot?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Booking is easy! Use our online booking form, select your date, departure time, and number of passengers. You'll receive a confirmation email with your reservation details within minutes."
        }
      },
      {
        "@type": "Question",
        "name": "How long does the trip take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The total journey takes 100-130 minutes including our 10-minute Rock Hill stop, depending on traffic conditions."
        }
      },
      {
        "@type": "Question",
        "name": "What's the difference between pricing tiers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "First 100 customers get $31 forever. Regular rate is $35. Students and military personnel get $32 with valid ID."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(busRouteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}