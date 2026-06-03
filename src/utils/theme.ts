export interface RankTheme {
  id: string;
  name: string;
  min: number;
  max: number;
  emoji: string;
  textClass: string;
  tagline: string;
  desc: string;
  
  // Outer Page Styles
  pageBg: string;              
  selectionBg: string;         
  
  // Card and Component Styles
  cardBg: string;              
  cardBorder: string;          
  cardText: string;            
  cardHeaderBg: string;        
  innerTileBg: string;         
  innerTileBorder: string;     

  // Dynamic interactive element styles
  primaryButton: string;       
  secondaryBadge: string;      
  headerPill: string;          
  chartLineColor: string;      
  chartAreaColor: string;      
  chartBarActive: string;      
  
  // Special UI overlays or effects classes
  containerGlowClass?: string;  
  animatedEffectsCss?: string;  
  overlayHtml?: string;         
}

// Consistent, high-contrast, professional serious layout with pure black borders and crisp black text
const UNIFORM_SERIOUS_THEME_BASE = {
  pageBg: 'bg-beige-50',
  selectionBg: 'selection:bg-neutral-200 selection:text-black',
  cardBg: 'theme-card bg-white border-2 border-black text-black transition-all duration-300',
  cardBorder: 'border-2 border-black',
  cardText: 'text-black',
  cardHeaderBg: 'bg-neutral-100 border-b-2 border-black text-black font-mono',
  innerTileBg: 'bg-white hover:bg-neutral-50 border-2 border-black text-black transition-colors',
  innerTileBorder: 'border-2 border-black',
  primaryButton: 'bg-black text-white hover:bg-neutral-900 font-bold active:scale-95 transition-all text-center border-2 border-black',
  secondaryBadge: 'bg-neutral-100 text-black border-2 border-black font-bold',
  headerPill: 'text-black bg-neutral-100 border-2 border-black',
  chartLineColor: '#000000',
  chartAreaColor: 'rgba(0, 0, 0, 0.04)',
  chartBarActive: 'fill-black',
  containerGlowClass: '',
  animatedEffectsCss: '',
  overlayHtml: ''
};

export const RANK_THEMES: RankTheme[] = [
  {
    id: 'standard',
    name: 'Standard Practice Scope',
    min: 0,
    max: 100,
    emoji: '📊',
    textClass: 'text-black font-black',
    tagline: 'CONSISTENCY LEVEL: STANDARD',
    desc: 'Formal performance layout, designed for steady schedule reinforcement and progress records.',
    ...UNIFORM_SERIOUS_THEME_BASE
  }
];

export function getRankThemeForTracker(trackerPercentile: number): RankTheme {
  return RANK_THEMES[0];
}
