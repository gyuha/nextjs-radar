/**
 * Fuzzy search utilities for Next.js Radar
 */

export interface FuzzyMatch {
  item: any;
  score: number;
  matches: number[];
}

/**
 * Calculate fuzzy search score between query and text
 * @param query Search query
 * @param text Text to search in
 * @returns Score (higher is better) and match positions
 */
export function fuzzyScore(query: string, text: string): { score: number; matches: number[] } {
  if (!query) {
    return { score: 1, matches: [] };
  }
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  if (queryLower === textLower) {
    return { score: 100, matches: Array.from({ length: text.length }, (_, i) => i) };
  }
  
  if (textLower.includes(queryLower)) {
    const startIndex = textLower.indexOf(queryLower);
    const matches = Array.from({ length: queryLower.length }, (_, i) => startIndex + i);
    return { score: 80 - startIndex, matches };
  }
  
  // Character-by-character fuzzy matching
  let score = 0;
  let matches: number[] = [];
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let previousMatchIndex = -1;
  
  for (let textIndex = 0; textIndex < textLower.length && queryIndex < queryLower.length; textIndex++) {
    if (textLower[textIndex] === queryLower[queryIndex]) {
      matches.push(textIndex);
      
      // Bonus for consecutive matches
      if (textIndex === previousMatchIndex + 1) {
        consecutiveMatches++;
        score += 5 + consecutiveMatches; // Increasing bonus for consecutive matches
      } else {
        consecutiveMatches = 0;
        score += 1;
      }
      
      // Bonus for matching at word boundaries
      if (textIndex === 0 || textLower[textIndex - 1] === ' ' || textLower[textIndex - 1] === '/' || textLower[textIndex - 1] === '-') {
        score += 10;
      }
      
      previousMatchIndex = textIndex;
      queryIndex++;
    }
  }
  
  // Penalty for unmatched characters in query
  if (queryIndex < queryLower.length) {
    score -= (queryLower.length - queryIndex) * 10;
  }
  
  // Penalty for length difference
  score -= Math.abs(textLower.length - queryLower.length) * 0.1;
  
  return { score: Math.max(0, score), matches };
}

/**
 * Perform fuzzy search on a list of items
 * @param query Search query
 * @param items Items to search
 * @param getText Function to extract searchable text from item
 * @param minScore Minimum score threshold
 * @returns Sorted array of matches
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  getText: (item: T) => string | string[],
  minScore: number = 0
): FuzzyMatch[] {
  if (!query.trim()) {
    return items.map(item => ({ item, score: 1, matches: [] }));
  }
  
  const results: FuzzyMatch[] = [];
  
  for (const item of items) {
    const texts = Array.isArray(getText(item)) ? getText(item) as string[] : [getText(item) as string];
    let bestScore = 0;
    let bestMatches: number[] = [];
    
    // Find the best match among all text fields
    for (const text of texts) {
      const { score, matches } = fuzzyScore(query, text);
      if (score > bestScore) {
        bestScore = score;
        bestMatches = matches;
      }
    }
    
    if (bestScore >= minScore) {
      results.push({
        item,
        score: bestScore,
        matches: bestMatches
      });
    }
  }
  
  // Sort by score (descending) and then by original order
  return results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return 0; // Maintain original order for items with same score
  });
}

/**
 * Highlight matches in text
 * @param text Original text
 * @param matches Array of match positions
 * @param highlightStart Start tag for highlighting
 * @param highlightEnd End tag for highlighting
 * @returns Highlighted text
 */
export function highlightMatches(
  text: string,
  matches: number[],
  highlightStart: string = '<mark>',
  highlightEnd: string = '</mark>'
): string {
  if (!matches.length) {
    return text;
  }
  
  let result = '';
  let lastIndex = 0;
  let inHighlight = false;
  
  const sortedMatches = [...matches].sort((a, b) => a - b);
  
  for (let i = 0; i < sortedMatches.length; i++) {
    const matchIndex = sortedMatches[i];
    const isConsecutive = i > 0 && sortedMatches[i - 1] === matchIndex - 1;
    
    if (!inHighlight && !isConsecutive) {
      result += text.slice(lastIndex, matchIndex) + highlightStart;
      inHighlight = true;
    } else if (!inHighlight) {
      result += text.slice(lastIndex, matchIndex) + highlightStart;
      inHighlight = true;
    }
    
    const isLastOrNotConsecutive = i === sortedMatches.length - 1 || sortedMatches[i + 1] !== matchIndex + 1;
    
    if (isLastOrNotConsecutive) {
      result += text[matchIndex] + highlightEnd;
      inHighlight = false;
      lastIndex = matchIndex + 1;
    } else {
      result += text[matchIndex];
    }
  }
  
  result += text.slice(lastIndex);
  return result;
}