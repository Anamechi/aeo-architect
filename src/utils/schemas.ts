// Consolidated schema generators for AEO/SEO compliance
// Use this file for all schema generation - replaces src/utils/schema.ts

export const SITE_URL = "https://home.anamechimarketing.com";
export const SITE_NAME = "ANAMECHI Marketing";
export const LOGO_URL = `${SITE_URL}/anamechi-logo.svg`;

// Organization Schema - use on all pages
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": SITE_NAME,
  "url": SITE_URL,
  "logo": LOGO_URL,
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

// Local Business Schema - use on location/contact pages
export const generateLocalBusinessSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": SITE_NAME,
  "image": LOGO_URL,
  "url": SITE_URL,
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

// Person Schema - for author/founder pages
export const generatePersonSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dr. Deanna Romulus",
  "jobTitle": "Founder & Visionary Strategist",
  "affiliation": {
    "@type": "Organization",
    "name": SITE_NAME
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

// WebSite Schema - for homepage
export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": SITE_URL,
  "name": SITE_NAME,
  "description": "AI Engine Optimization and Digital Marketing for Service Businesses",
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${SITE_URL}/search?q={query}`,
    "query-input": "required name=query"
  }
});

// Breadcrumb Schema Generator
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`
  }))
});

// Speakable Schema - FIXED with proper CSS selectors that match actual DOM
export const generateSpeakableSchema = (
  pagePath: string, 
  selectors: string[] = ['.main-content', 'h1', '.hero-summary', '.summary', 'article']
) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": `${SITE_URL}${pagePath}`,
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": selectors
  }
});

// Article Schema Generator
export const generateArticleSchema = (article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  url: string;
  imageUrl?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.description,
  "author": {
    "@type": "Person",
    "name": article.author,
    "url": `${SITE_URL}/about`,
  },
  "publisher": {
    "@type": "Organization",
    "name": SITE_NAME,
    "logo": {
      "@type": "ImageObject",
      "url": LOGO_URL,
    },
  },
  "datePublished": article.datePublished,
  "dateModified": article.dateModified,
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": article.url.startsWith("http") ? article.url : `${SITE_URL}${article.url}`,
  },
  ...(article.imageUrl && {
    "image": {
      "@type": "ImageObject",
      "url": article.imageUrl,
    },
  }),
});

// FAQ Schema Generator
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
});

// Contact Page Schema
export const generateContactPageSchema = () => ({
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": `Contact ${SITE_NAME}`,
  "description": "Get in touch with ANAMECHI Marketing for AI Engine Optimization and marketing services.",
  "url": `${SITE_URL}/contact`,
  "mainEntity": {
    "@type": "Organization",
    "name": SITE_NAME,
    "email": "info@anamechimarketing.com",
    "telephone": "+1-866-752-7370",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "101 Lindenwood Dr STE 225",
      "addressLocality": "Malvern",
      "addressRegion": "PA",
      "postalCode": "19355",
      "addressCountry": "US"
    }
  }
});

// Service Schema Generator
export const generateServiceSchema = (service: {
  name: string;
  description: string;
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": service.name,
  "description": service.description,
  "provider": {
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL
  },
  "url": service.url.startsWith("http") ? service.url : `${SITE_URL}${service.url}`
});
