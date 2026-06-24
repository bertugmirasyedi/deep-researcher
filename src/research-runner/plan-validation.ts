import type { DiscoveryMap, ResearchPlan } from './schemas';

export function validatePlanAgainstDiscovery(plan: ResearchPlan, discovery: DiscoveryMap): string[] {
  const errors: string[] = [];
  const entityIds = new Set(discovery.entities.map((entity) => entity.id));
  const entityNames = new Set(discovery.entities.map((entity) => entity.name.toLowerCase()));
  const dimensionNames = new Set(discovery.dimensions.map((dimension) => dimension.name));

  for (const subQuestion of plan.subQuestions) {
    for (const entityId of subQuestion.seededByEntityIds) {
      if (!entityIds.has(entityId)) {
        errors.push(`${subQuestion.id} seededByEntityIds missing from DiscoveryMap.entities: ${entityId}`);
      }
    }

    for (const dimensionName of subQuestion.seededByDimensionNames) {
      if (!dimensionNames.has(dimensionName)) {
        errors.push(`${subQuestion.id} seededByDimensionNames missing from DiscoveryMap.dimensions: ${dimensionName}`);
      }
    }

    for (const entityName of subQuestion.allNamedEntitiesInQuestion) {
      if (!entityNames.has(entityName.toLowerCase())) {
        errors.push(`${subQuestion.id} allNamedEntitiesInQuestion absent from DiscoveryMap.entities: ${entityName}`);
      }
    }
  }

  if (plan.depth === 'deep' && plan.subQuestions.length < 6) {
    errors.push('deep plans require at least six subquestions');
  }

  if (plan.depth === 'quick' && plan.subQuestions.length !== 3) {
    errors.push('quick plans require exactly three subquestions');
  }

  return errors;
}
