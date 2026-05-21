import { z } from "zod";

export const paginationInput = z.object({
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().uuid().optional(),
});

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}
