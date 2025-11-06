export const generateArticleSchema = (article: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  url: string;
  imageUrl?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  author: {
    '@type': 'Person',
    name: article.author,
    url: 'https://anamechimarketing.com/about',
  },
  publisher: {
    '@type': 'Organization',
    name: 'ANAMECHI Marketing',
    logo: {
      '@type': 'ImageObject',
      url: 'https://anamechimarketing.com/logo.png',
    },
  },
  datePublished: article.datePublished,
  dateModified: article.dateModified,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': article.url,
  },
  ...(article.imageUrl && {
    image: {
      '@type': 'ImageObject',
      url: article.imageUrl,
    },
  }),
});

export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ANAMECHI Marketing',
  url: 'https://anamechimarketing.com',
  logo: 'https://anamechimarketing.com/logo.png',
  description: 'Digital marketing agency empowering coaches and consultants through automation and AI systems.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '101 Lindenwood Dr STE 225',
    addressLocality: 'Malvern',
    addressRegion: 'PA',
    postalCode: '19355',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.0362,
    longitude: -75.5138,
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'info@anamechimarketing.com',
    availableLanguage: 'English',
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
  },
  founder: {
    '@type': 'Person',
    name: 'Dr. Deanna Romulus',
    jobTitle: 'Founder & CEO',
  },
  sameAs: [
    'https://www.linkedin.com/company/anamechi-marketing',
    'https://twitter.com/anamechimarketing',
  ],
});

export const generateLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'ANAMECHI Marketing',
  image: 'https://anamechimarketing.com/logo.png',
  url: 'https://anamechimarketing.com',
  email: 'info@anamechimarketing.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '101 Lindenwood Dr STE 225',
    addressLocality: 'Malvern',
    addressRegion: 'PA',
    postalCode: '19355',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.0362,
    longitude: -75.5138,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  priceRange: '$$',
  founder: {
    '@type': 'Person',
    name: 'Dr. Deanna Romulus',
  },
  areaServed: {
    '@type': 'State',
    name: 'Pennsylvania',
  },
  knowsAbout: [
    'Marketing Automation',
    'CRM Implementation',
    'Brand Strategy',
    'Digital Marketing',
    'AI Content Systems',
  ],
});

export const generateSpeakableSchema = (sections: string[]) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: sections,
  },
});
