export default {
  rest: {
    defaultLimit: 25,
    // The gallery ships 30 images and products 6 — one page has to be able to
    // hold a whole collection so the frontend never has to paginate content.
    maxLimit: 200,
    withCount: true,
  },
};
