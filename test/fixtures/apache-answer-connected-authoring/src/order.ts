export const QUESTION_ORDER_KEYS = ["newest", "active", "recommend"] as const
export type QuestionOrder = typeof QUESTION_ORDER_KEYS[number]
