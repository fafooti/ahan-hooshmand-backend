import { boardRepository } from '../repositories/board.repository';

export const boardService = {
  async getPublicBoard() {
    const categories = await boardRepository.findBoardData();

    return categories
      .filter((category) => category.products.length > 0)
      .map((category) => ({
        category: {
          id: category.id,
          name: category.name,
        },
        products: category.products,
      }));
  },
};
