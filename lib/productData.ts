import fs from 'fs';
import path from 'path';

export interface Ingredient {
  name: string;
  traditionalUses: string;
  scientificBenefits: string;
  mechanismsOfAction: string;
  safetyProfile: string;
}

export interface ProductData {
  id: 'youth' | 'roman';
  name: string;
  subtitle: string;
  price: string;
  ingredients: Ingredient[];
  summary: string;
}

// Helper function to clean text - remove citations and references
function cleanText(text: string): string {
  return text
    .replace(/\[\d+\]/g, '') // Remove citation numbers like [1], [2], etc.
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
    .trim();
}

// Parse productinfo.md and extract structured data
function parseProductInfo(): { roman: ProductData; youth: ProductData } {
  const filePath = path.join(process.cwd(), 'productinfo.md');
  const content = fs.readFileSync(filePath, 'utf-8');

  // Roman Xperience ingredients
  const romanIngredients: Ingredient[] = [];
  
  // Extract L-Citrulline
  const citrullineMatch = content.match(/L-Citrulline\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nMaca Root|$)/s);
  if (citrullineMatch) {
    romanIngredients.push({
      name: 'L-Citrulline',
      traditionalUses: cleanText(citrullineMatch[1]),
      scientificBenefits: cleanText(citrullineMatch[2]),
      mechanismsOfAction: cleanText(citrullineMatch[3]),
      safetyProfile: cleanText(citrullineMatch[4]),
    });
  }

  // Extract Maca Root
  const macaMatch = content.match(/Maca Root \(Lepidium meyenii\)\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nKorean Red Ginseng|$)/s);
  if (macaMatch) {
    romanIngredients.push({
      name: 'Maca Root (Lepidium meyenii)',
      traditionalUses: cleanText(macaMatch[1]),
      scientificBenefits: cleanText(macaMatch[2]),
      mechanismsOfAction: cleanText(macaMatch[3]),
      safetyProfile: cleanText(macaMatch[4]),
    });
  }

  // Extract Korean Red Ginseng
  const ginsengMatch = content.match(/Korean Red Ginseng \(Panax ginseng\)\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nXperience Youth Ingredients|$)/s);
  if (ginsengMatch) {
    romanIngredients.push({
      name: 'Korean Red Ginseng (Panax ginseng)',
      traditionalUses: cleanText(ginsengMatch[1]),
      scientificBenefits: cleanText(ginsengMatch[2]),
      mechanismsOfAction: cleanText(ginsengMatch[3]),
      safetyProfile: cleanText(ginsengMatch[4]),
    });
  }

  // Xperience Youth ingredients
  const youthIngredients: Ingredient[] = [];

  // Extract Deer Antler Velvet Extract
  const deerVelvetMatch = content.match(/Deer Antler Velvet Extract\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nL-Arginine|$)/s);
  if (deerVelvetMatch) {
    youthIngredients.push({
      name: 'Deer Antler Velvet Extract',
      traditionalUses: cleanText(deerVelvetMatch[1]),
      scientificBenefits: cleanText(deerVelvetMatch[2]),
      mechanismsOfAction: cleanText(deerVelvetMatch[3]),
      safetyProfile: cleanText(deerVelvetMatch[4]),
    });
  }

  // Extract L-Arginine
  const arginineMatch = content.match(/L-Arginine\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nEpimedium|$)/s);
  if (arginineMatch) {
    youthIngredients.push({
      name: 'L-Arginine',
      traditionalUses: cleanText(arginineMatch[1]),
      scientificBenefits: cleanText(arginineMatch[2]),
      mechanismsOfAction: cleanText(arginineMatch[3]),
      safetyProfile: cleanText(arginineMatch[4]),
    });
  }

  // Extract Epimedium (Horny Goat Weed)
  const epimediumMatch = content.match(/Epimedium \(Horny Goat Weed\)\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nTribulus terrestris|$)/s);
  if (epimediumMatch) {
    youthIngredients.push({
      name: 'Epimedium (Horny Goat Weed)',
      traditionalUses: cleanText(epimediumMatch[1]),
      scientificBenefits: cleanText(epimediumMatch[2]),
      mechanismsOfAction: cleanText(epimediumMatch[3]),
      safetyProfile: cleanText(epimediumMatch[4]),
    });
  }

  // Extract Tribulus terrestris
  const tribulusMatch = content.match(/Tribulus terrestris\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nEurycoma longifolia|$)/s);
  if (tribulusMatch) {
    youthIngredients.push({
      name: 'Tribulus terrestris',
      traditionalUses: cleanText(tribulusMatch[1]),
      scientificBenefits: cleanText(tribulusMatch[2]),
      mechanismsOfAction: cleanText(tribulusMatch[3]),
      safetyProfile: cleanText(tribulusMatch[4]),
    });
  }

  // Extract Eurycoma longifolia (Tongkat Ali)
  const tongkatMatch = content.match(/Eurycoma longifolia \(Tongkat Ali\)\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nNiacin|$)/s);
  if (tongkatMatch) {
    youthIngredients.push({
      name: 'Eurycoma longifolia (Tongkat Ali)',
      traditionalUses: cleanText(tongkatMatch[1]),
      scientificBenefits: cleanText(tongkatMatch[2]),
      mechanismsOfAction: cleanText(tongkatMatch[3]),
      safetyProfile: cleanText(tongkatMatch[4]),
    });
  }

  // Extract Niacin (Vitamin B3)
  const niacinMatch = content.match(/Niacin \(Vitamin B3\)\nTraditional Uses: (.*?)\nScientific Benefits: (.*?)\nMechanisms of Action: (.*?)\nSafety Profile: (.*?)(?=\nNatural Supplements|$)/s);
  if (niacinMatch) {
    youthIngredients.push({
      name: 'Niacin (Vitamin B3)',
      traditionalUses: cleanText(niacinMatch[1]),
      scientificBenefits: cleanText(niacinMatch[2]),
      mechanismsOfAction: cleanText(niacinMatch[3]),
      safetyProfile: cleanText(niacinMatch[4]),
    });
  }

  // Extract summary from the conclusion section - only get the first few paragraphs, exclude references
  const summaryMatch = content.match(/Summary and Conclusion\n(.*?)(?=\n\n\[|$)/s);
  let summary = '';
  if (summaryMatch) {
    const rawSummary = summaryMatch[1];
    // Split by paragraphs and take only the meaningful content (first 3 paragraphs)
    const paragraphs = rawSummary.split(/\n\n+/).filter(p => p.trim() && !p.includes('http'));
    summary = cleanText(paragraphs.slice(0, 3).join('\n\n'));
  } else {
    summary = 'Roman Xperience and Xperience Youth leverage all-natural formulas to support male performance and erectile function through carefully selected ingredients backed by traditional use and modern scientific research.';
  }

  return {
    roman: {
      id: 'roman',
      name: 'Roman Xperience',
      subtitle: 'Premium Formula',
      price: '$59.95',
      ingredients: romanIngredients,
      summary: summary,
    },
    youth: {
      id: 'youth',
      name: 'Xperience Youth',
      subtitle: 'Liquid Formula',
      price: '$44.95',
      ingredients: youthIngredients,
      summary: summary,
    },
  };
}

// Cache the parsed data
let cachedData: { roman: ProductData; youth: ProductData } | null = null;

export function getProductData(): { roman: ProductData; youth: ProductData } {
  if (!cachedData) {
    cachedData = parseProductInfo();
  }
  return cachedData;
}

export function getProductById(id: 'youth' | 'roman'): ProductData | null {
  const data = getProductData();
  return data[id] || null;
}

