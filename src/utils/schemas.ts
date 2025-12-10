// Global schema generators for AEO compliance

export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ANAMECHI Marketing",
  "url": "https://home.anamechimarketing.com",
  "logo": "https://home.anamechimarketing.com/anamechi-logo.svg",
  "description": "Digital marketing agency empowering coaches and consultants through AI Engine Optimization, marketing automation, and AI systems.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "101 Lindenwood Dr STE 225",
    "addressLocality": "Malvern",
    "addressRegion": "PA",
    "postalCode": "19355",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.0362,
    "longitude": -75.5138
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "info@anamechimarketing.com",
    "telephone": "+1-866-752-7370",
    "availableLanguage": "English",
    "hoursAvailable": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  },
  "founder": {
    "@type": "Person",
    "name": "Dr. Deanna Romulus",
    "jobTitle": "Founder & CEO"
  },
  "sameAs": [
    "https://www.linkedin.com/in/deannaromulus",
    "https://x.com/anamechi",
    "https://www.youtube.com/@ANAMECHI"
  ],
  "knowsAbout": [
    "AI Engine Optimization",
    "Marketing Automation",
    "CRM Implementation",
    "Brand Strategy",
    "Digital Marketing",
    "AI Content Systems"
  ]
});

export const generateSpeakableSchema = (pageUrl: string, selectors: string[] = ['.main-content', 'h1', '.summary']) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": pageUrl,
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": selectors
  }
});

export const generatePersonSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dr. Deanna Romulus",
  "jobTitle": "Founder & Visionary Strategist",
  "affiliation": {
    "@type": "Organization",
    "name": "ANAMECHI Marketing"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Malvern",
    "addressRegion": "PA",
    "addressCountry": "US"
  },
  "knowsAbout": [
    "AI Engine Optimization",
    "Marketing Automation",
    "Business Strategy",
    "Digital Marketing",
    "CRM Systems",
    "Brand Development"
  ],
  "sameAs": [
    "https://www.linkedin.com/in/deannaromulus",
    "https://x.com/anamechi",
    "https://www.youtube.com/@ANAMECHI"
  ],
  "email": "info@anamechimarketing.com"
});

export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "ANAMECHI Marketing",
  "image": "https://home.anamechimarketing.com/anamechi-logo.svg",
  "url": "https://home.anamechimarketing.com",
  "telephone": "+1-866-752-7370",
  "email": "info@anamechimarketing.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "101 Lindenwood Dr STE 225",
    "addressLocality": "Malvern",
    "addressRegion": "PA",
    "postalCode": "19355",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.0362,
    "longitude": -75.5138
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      "opens": "09:00",
      "closes": "18:00"
    }
  ],
  "priceRange": "$$",
  "founder": {
    "@type": "Person",
    "name": "Dr. Deanna Romulus"
  },
  "areaServed": {
    "@type": "State",
    "name": "Pennsylvania"
  },
  "knowsAbout": [
    "AI Engine Optimization",
    "Marketing Automation",
    "CRM Implementation",
    "Brand Strategy",
    "Digital Marketing",
    "AI Content Systems"
  ]
});

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://home.anamechimarketing.com",
  "name": "ANAMECHI Marketing",
  "description": "AI Engine Optimization and Digital Marketing for Service Businesses",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://home.anamechimarketing.com/search?q={query}",
    "query-input": "required name=query"
  }
});
