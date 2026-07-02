import { NextFunction, Request, Response } from 'express';

import { productService } from '../services/product.service';

import {

  parseProductId,

  parseProductListQuery,

  validateBulkPriceUpdateInput,

  validateCreateProductInput,

  validateUpdateProductInput,

} from '../validators/product.validator';



export const productController = {

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const query = parseProductListQuery(req.query as Record<string, unknown>);

      const products = await productService.list(query);

      res.status(200).json(products);

    } catch (error) {

      next(error);

    }

  },



  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseProductId(req.params.id);

      const product = await productService.getById(id);

      res.status(200).json(product);

    } catch (error) {

      next(error);

    }

  },



  async create(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const input = validateCreateProductInput(req.body);

      const product = await productService.create(input, req.user?.id);

      res.status(201).json(product);

    } catch (error) {

      next(error);

    }

  },



  async update(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseProductId(req.params.id);

      const input = validateUpdateProductInput(req.body);

      const product = await productService.update(id, input, req.user?.id);

      res.status(200).json(product);

    } catch (error) {

      next(error);

    }

  },



  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseProductId(req.params.id);

      await productService.remove(id, req.user?.id);

      res.status(204).send();

    } catch (error) {

      next(error);

    }

  },



  async getPriceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseProductId(req.params.id);

      const history = await productService.getPriceHistory(id);

      res.status(200).json(history);

    } catch (error) {

      next(error);

    }

  },



  async bulkUpdate(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const input = validateBulkPriceUpdateInput(req.body);

      const products = await productService.bulkUpdate(input, req.user?.id);

      res.status(200).json(products);

    } catch (error) {

      next(error);

    }

  },

};


