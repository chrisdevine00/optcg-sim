/**
 * `@optcg/ai/review` (M9 WP7): the review job itself (runner, scheduler, detector registry, the
 * `puzzle` answer). Only the review worker and tests run it; the `@optcg/ai` barrel holds the review's
 * types, plan and adapter, so the Game chunk does not carry every detector.
 */
export * from './search/review/index.ts';
