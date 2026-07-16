/** Stores the winner and loser of each completed knockout match by match number. */
export type BracketResults = Record<number, { winner: string; loser: string }>;
