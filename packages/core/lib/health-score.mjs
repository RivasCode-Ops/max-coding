/**
 * Health score — delega às 12 categorias PRD Max Stack
 */
import { analyzeCategories, CATEGORY_DEFS } from './categories.mjs'

export { CATEGORY_DEFS }

export function computeHealthScore(profile) {
  const r = analyzeCategories(profile)
  return {
    overall: r.overall,
    grade: r.grade,
    categories: r.categories,
    summary: r.summary,
  }
}
