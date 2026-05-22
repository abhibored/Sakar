import { Vendor } from '../types';

export interface SocialMediaPost {
  id: string;
  platform: 'X (Twitter)' | 'LinkedIn' | 'Reddit' | 'Consumer Forum';
  username: string;
  handle: string;
  avatarUrl?: string;
  content: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  engagement: 'Low' | 'Medium' | 'High';
  likes: number;
}

export interface SocialMediaAnalysis {
  overallSentiment: 'Positive' | 'Negative' | 'Neutral';
  sentimentScores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  narrativeSummary: string;
  posts: SocialMediaPost[];
}

// Deterministic pseudo-random number generator for seed
function seededRandom(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function generateSocialMediaAnalysis(vendor: Vendor): SocialMediaAnalysis {
  const rand = seededRandom(vendor.id + vendor.name);
  const nextFloat = () => rand();
  const nextInt = (min: number, max: number) => Math.floor(nextFloat() * (max - min + 1)) + min;
  const pick = <T>(arr: T[]): T => arr[Math.floor(nextFloat() * arr.length)];

  const { name, sector } = vendor;

  // Let's create realistic usernames and handles
  const firstNames = ['Sarah', 'David', 'Alex', 'Elena', 'Michael', 'Chloe', 'Marcus', 'Raj', 'Yuki', 'Sven', 'Emma', 'Tariq'];
  const lastNames = ['Miller', 'Chen', 'Dupont', 'Silva', 'Gomez', 'Patel', 'OConnor', 'Tanaka', 'Jansen', 'Nielsen', 'Mwangi'];
  const designations = ['Procurement Director', 'CPG Strategy Lead', 'Sustainability Officer', 'Supply Chain Consultant', 'Industry Analyst', 'Brand Manager'];

  // Sector-specific templates
  let customPosts: { platform: SocialMediaPost['platform']; template: string; sentiment: 'positive' | 'negative' | 'neutral' }[] = [];

  if (sector.includes('Packaged Foods')) {
    customPosts = [
      {
        platform: 'X (Twitter)',
        template: `Switching our retail grocery inventory over to {name} components for our next-gen organic snacks lineup. Excellent freshness indexes and moisture control!`,
        sentiment: 'positive',
      },
      {
        platform: 'Reddit',
        template: `Anyone else run into texture inconsistencies with {name} packaged snack materials lately? Heard from a couple of franchise managers about short-dated batches.`,
        sentiment: 'negative',
      },
      {
        platform: 'LinkedIn',
        template: `Proud to highlight our deep collaborative relationship with {name} as we optimize raw wheat supply-chains. Their multi-regional milling facilities ensure stability even under tight agricultural conditions.`,
        sentiment: 'positive',
      },
      {
        platform: 'Consumer Forum',
        template: `Checking out the ingredient label for the new healthy bars sourced from {name}. Glad to see they completely completed the transition away from artificial stabilizers.`,
        sentiment: 'positive',
      },
      {
        platform: 'X (Twitter)',
        template: `Hearing rumors on the floor about {name} adjusting bulk shipments. Hoping this doesn't disrupt store-level stock for the core holiday season.`,
        sentiment: 'neutral',
      }
    ];
  } else if (sector.includes('Beverage')) {
    customPosts = [
      {
        platform: 'LinkedIn',
        template: `Fascinating update on automated bottling efficiency! Partnering with {name} has allowed us to reduce packaging glass weight by 14% while retaining high pressure ratings.`,
        sentiment: 'positive',
      },
      {
        platform: 'Reddit',
        template: `Spoke to a supply clerk and apparently {name} beverages deliveries have been delayed for 3 weeks due to CO2 carbonation canister shortages at their regional depot.`,
        sentiment: 'negative',
      },
      {
        platform: 'X (Twitter)',
        template: `{name} announced their new solar-powered brewery and distillation plant facility is going online. Huge win for decarbonizing the CPG logistics loop!`,
        sentiment: 'positive',
      },
      {
        platform: 'Consumer Forum',
        template: `Has there been a formula change for the craft beverage base supplied by {name}? The mineral contents seem slightly altered in the latest batch.`,
        sentiment: 'neutral',
      },
      {
        platform: 'X (Twitter)',
        template: `Bulk order of aluminum cans from {name} arrived on time. Box labels are clean, tracking coordinates were precise. Stable partner.`,
        sentiment: 'positive',
      }
    ];
  } else if (sector.includes('Cosmetics') || sector.includes('Personal Care')) {
    customPosts = [
      {
        platform: 'Consumer Forum',
        template: `Trying the new fragrance base from {name} laboratories. Absolutely seamless integration with skin-active serums, no micro-crystallization reported.`,
        sentiment: 'positive',
      },
      {
        platform: 'X (Twitter)',
        template: `Extremely disappointed with {name} packaging solutions. The lotion pump caps keep breaking in transit, leading to leakage complaints on retail shelves. Fix it!`,
        sentiment: 'negative',
      },
      {
        platform: 'LinkedIn',
        template: `Incredible speech by the Chief Chemist at {name} on biodegradable surfactant alternatives. Setting absolute transparency models for personal care cosmetics.`,
        sentiment: 'positive',
      },
      {
        platform: 'Reddit',
        template: `Rumors say dermatologist coalitions are auditing several batch formulation protocols at {name} regarding hypoallergenic thresholds. Watching strictly.`,
        sentiment: 'neutral',
      },
      {
        platform: 'X (Twitter)',
        template: `Clean beauty ingredients sourced from {name} arrived safely. Eco-friendly organic stamp is fully verified. Customers will love this transition.`,
        sentiment: 'positive',
      }
    ];
  } else if (sector.includes('Packaging')) {
    customPosts = [
      {
        platform: 'LinkedIn',
        template: `{name} continues to crush the sustainable cardboard packaging space. Their biodegradable wax lining holds up flawlessly against heat-sealing.`,
        sentiment: 'positive',
      },
      {
        platform: 'Reddit',
        template: `Is {name} hiking their structural packaging pricing again? Small brands are getting completely priced out of recycled fiber boxes. Feels anti-competitive.`,
        sentiment: 'negative',
      },
      {
        platform: 'X (Twitter)',
        template: `Our custom shipping packs from {name} just passed raw compression stress testing! Incredible structural load capacity for eco-materials.`,
        sentiment: 'positive',
      },
      {
        platform: 'Consumer Forum',
        template: `Love the touch-texture of {name}'s compostable food bags. However, the tearing tab requires a bit too much force. Hope they refine this in the next release.`,
        sentiment: 'neutral',
      },
      {
        platform: 'LinkedIn',
        template: `Implementing {name} smart labeling tech into our primary inventory warehouses. RFID tracking margins are showing 99.8% precision.`,
        sentiment: 'positive',
      }
    ];
  } else if (sector.includes('Agricultural') || sector.includes('Oils')) {
    customPosts = [
      {
        platform: 'LinkedIn',
        template: `Critical update on global vegetable oil pricing: Sourcing from {name} has shielded our packaged foods brands from recent soy import tariff shockwaves.`,
        sentiment: 'positive',
      },
      {
        platform: 'Reddit',
        template: `Check the EPA compliance database, rumors are circulating about runoff issues at one of {name}'s major regional canola refining hubs.`,
        sentiment: 'negative',
      },
      {
        platform: 'X (Twitter)',
        template: `{name} seed oil derivatives show impressive stability benchmarks under extreme frying temperature simulations. Safe ingredients.`,
        sentiment: 'positive',
      },
      {
        platform: 'Consumer Forum',
        template: `There's a global shift towards sustainable sunflower imports and {name}'s logistics pipeline seems to be keeping firm pricing pace.`,
        sentiment: 'neutral',
      },
      {
        platform: 'LinkedIn',
        template: `Outstanding execution by {name} in trace-certifying 100% of their palm oil derivatives. Transparency yields secure raw supply nodes.`,
        sentiment: 'positive',
      }
    ];
  } else if (sector.includes('Logistics') || sector.includes('Cold-Chain')) {
    customPosts = [
      {
        platform: 'LinkedIn',
        template: `Re-route finished frozen shipments through {name}'s cold-chain. Real-time temperature logs represent steady -18C telemetry. Essential protection.`,
        sentiment: 'positive',
      },
      {
        platform: 'X (Twitter)',
        template: `Warning to shipping dispatchers: avoid {name} regional trucks during port congestion times. They have been suffering huge driver shortage delays.`,
        sentiment: 'negative',
      },
      {
        platform: 'Reddit',
        template: `Checking out the telemetry software on {name} refrigerated transport fleets. Elegant, responsive UI and solid IoT backup alerts.`,
        sentiment: 'positive',
      },
      {
        platform: 'Consumer Forum',
        template: `Noticeable moisture levels in the recent delivery carton from {name} transport. Potentially secondary cooling condensation. Keep an eye out.`,
        sentiment: 'neutral',
      },
      {
        platform: 'X (Twitter)',
        template: `Just completed load-transfer simulations utilizing {name} smart cooling pallets. Decent insulating barrier speeds.`,
        sentiment: 'positive',
      }
    ];
  } else {
    // General default templates for other sectors
    customPosts = [
      {
        platform: 'LinkedIn',
        template: `Exceptional operational consistency demonstrated by {name}. Our manufacturing teams enjoy consistent raw stock quality checkmarks.`,
        sentiment: 'positive',
      },
      {
        platform: 'Reddit',
        template: `Heard supply rumors regarding {name}'s parent holding company. They are dealing with liquidity issues which might squeeze inventory.`,
        sentiment: 'negative',
      },
      {
        platform: 'X (Twitter)',
        template: `{name} announced plans to expand domestic operations, reducing overseas shipping dependencies. A sensible step for localized risk mitigation.`,
        sentiment: 'positive',
      },
      {
        platform: 'Consumer Forum',
        template: `Evaluating {name} as a bulk component provider. They have decent reviews but support responsiveness represents standard delays.`,
        sentiment: 'neutral',
      },
      {
        platform: 'X (Twitter)',
        template: `Standard supply delivery of raw materials completed by {name}. Sealed boxes, checked invoices, everything matching up normally.`,
        sentiment: 'neutral',
      }
    ];
  }

  // Build 3 distinct deterministic posts from the templates
  const shuffledIndex = [0, 1, 2, 3, 4].sort(() => nextFloat() - 0.5);
  const selectedTemplates = [
    customPosts[shuffledIndex[0]],
    customPosts[shuffledIndex[1]],
    customPosts[shuffledIndex[2]]
  ];

  const posts: SocialMediaPost[] = selectedTemplates.map((item, idx) => {
    const fName = pick(firstNames);
    const lName = pick(lastNames);
    const postDateOffset = nextInt(1, 10);
    // Format date in May 2026
    const postDay = 22 - postDateOffset;
    const postDate = `2026-05-${postDay < 10 ? '0' + postDay : postDay}`;
    const cleanContent = item.template.replace(/{name}/g, name);
    const likes = nextInt(5, 78);

    return {
      id: `sm_${vendor.id}_${idx}`,
      platform: item.platform,
      username: `${fName} ${lName}`,
      handle: `@${fName.toLowerCase()}_${lName.toLowerCase()}${nextInt(10, 99)}`,
      content: cleanContent,
      date: postDate,
      sentiment: item.sentiment,
      engagement: likes > 50 ? 'High' : likes > 20 ? 'Medium' : 'Low',
      likes
    };
  });

  // Calculate sentiment metrics deterministically
  const posCount = posts.filter(p => p.sentiment === 'positive').length;
  const negCount = posts.filter(p => p.sentiment === 'negative').length;
  const neuCount = posts.filter(p => p.sentiment === 'neutral').length;

  const total = posCount + negCount + neuCount;
  const positive = Math.round((posCount / total) * 100);
  const negative = Math.round((negCount / total) * 100);
  const neutral = 100 - positive - negative;

  let overallSentiment: SocialMediaAnalysis['overallSentiment'] = 'Neutral';
  if (posCount > negCount && posCount > neuCount) overallSentiment = 'Positive';
  if (negCount > posCount && negCount > neuCount) overallSentiment = 'Negative';

  // Build sector/sentiment-aware narrative summaries
  let narrativeSummary = '';
  if (overallSentiment === 'Positive') {
    narrativeSummary = `Public focus around ${name} on social channels highlights strong manufacturing quality standards, eco-awareness praises, and clean sustainability strategies. Small-scale discussion on delivery timing remains, but general brand trust is highly optimistic.`;
  } else if (overallSentiment === 'Negative') {
    narrativeSummary = `Monitoring shows active discussion regarding potential shipping halts, raw ingredient shelf-life adjustments, or logistic bottlenecks linked to ${name}. Industrial peers recommend tracking active delivery variables while these rumors settle.`;
  } else {
    narrativeSummary = `Conversation logs regarding ${name} are balanced, revolving around typical bulk order validations, minor tab adjustment suggestions, or formula verification reports. No critical negative virality or massive brand-positive developments identified.`;
  }

  return {
    overallSentiment,
    sentimentScores: { positive, negative, neutral },
    narrativeSummary,
    posts
  };
}
