/* =========================
   Global state
========================= */

export const state = {
  lists: [],
  activeListId: null,
};

/* =========================
   Reset state
========================= */

export function resetState(nextState) {
  state.lists = nextState.lists || [];
  state.activeListId = nextState.activeListId || null;
}
