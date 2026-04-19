// Module-level set shared across all hooks.
// Ticket IDs in here have an in-flight mutation — incremental sync and
// background refetches should not overwrite their optimistic cache state.
export const pendingMutationIds = new Set<number>()
