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
    addressLocality: 'Plano',
    addressRegion: 'TX',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'hello@anamechimarketing.com',
  },
  founder: {
    '@type': 'Person',
    name: 'Dr. Deanna Romulus',
  },
  sameAs: [
    'https://www.linkedin.com/company/anamechi-marketing',
    'https://twitter.com/anamechimarketing',
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
