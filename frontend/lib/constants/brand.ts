/**
 * Palms Gig Brand Assets
 * All images hosted on Cloudinary CDN
 */

export const BRAND_IMAGES = {
  // SVG Logos (Recommended for web - smallest size, scales perfectly)
  logos: {
    svg: {
      horizontal: {
        orange: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212284/palms-gig/svg/logo-%281%29.svg',
        navy: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212285/palms-gig/svg/logo-%282%29.svg',
        white: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212288/palms-gig/svg/logo-%283%29.svg',
        alt: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212298/palms-gig/svg/logo-%288%29.svg',
      },
      icon: {
        orange: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212289/palms-gig/svg/logo-%284%29.svg',
        navy: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212292/palms-gig/svg/logo-%285%29.svg',
        white: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212294/palms-gig/svg/logo-%286%29.svg',
        gradient: 'https://res.cloudinary.com/dxhjpybe7/image/upload/v1770212296/palms-gig/svg/logo-%287%29.svg',
      },
    },
    png: {
      horizontal: {
        default: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212278/palms-gig/png/logo-%281%29.png',
        alt1: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212279/palms-gig/png/logo-%282%29.png',
        alt2: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212280/palms-gig/png/logo-%283%29.png',
        alt3: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212283/palms-gig/png/logo-%288%29.png',
      },
      icon: {
        default: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212280/palms-gig/png/logo-%284%29.png',
        alt1: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212281/palms-gig/png/logo-%285%29.png',
        alt2: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212282/palms-gig/png/logo-%286%29.png',
        alt3: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212282/palms-gig/png/logo-%287%29.png',
      },
    },
  },

  // Pattern background
  pattern: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212276/palms-gig/jpeg/pattern.png',

  // Full branding images/pages
  branding: {
    page1: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212222/palms-gig/branding-jpg/palms-gig-branding-page-%281%29.jpg',
    page2: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212247/palms-gig/branding-jpg/palms-gig-branding-page-%282%29.jpg',
    page3: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212249/palms-gig/branding-jpg/palms-gig-branding-page-%283%29.jpg',
    page15: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212241/palms-gig/branding-jpg/palms-gig-branding-page-%2815%29.jpg',
  },
} as const;

export const BRAND_COLORS = {
  orange: '#FF8F33',
  navy: '#001046',
  gray: '#F2F2F2',
} as const;
