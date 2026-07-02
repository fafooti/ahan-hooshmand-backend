import { NextFunction, Request, Response } from 'express';

import { categoryService } from '../services/category.service';

import {

  parseCategoryId,

  validateCreateCategoryInput,

  validateReorderCategoriesInput,

  validateUpdateCategoryInput,

} from '../validators/category.validator';



export const categoryController = {

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const categories = await categoryService.list();

      res.status(200).json(categories);

    } catch (error) {

      next(error);

    }

  },



  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseCategoryId(req.params.id);

      const category = await categoryService.getById(id);

      res.status(200).json(category);

    } catch (error) {

      next(error);

    }

  },



  async create(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const input = validateCreateCategoryInput(req.body);

      const category = await categoryService.create(input, req.user?.id);

      res.status(201).json(category);

    } catch (error) {

      next(error);

    }

  },



  async update(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseCategoryId(req.params.id);

      const input = validateUpdateCategoryInput(req.body);

      const category = await categoryService.update(id, input, req.user?.id);

      res.status(200).json(category);

    } catch (error) {

      next(error);

    }

  },



  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const id = parseCategoryId(req.params.id);

      await categoryService.remove(id, req.user?.id);

      res.status(204).send();

    } catch (error) {

      next(error);

    }

  },



  async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {

      const input = validateReorderCategoriesInput(req.body);

      const categories = await categoryService.reorder(input, req.user?.id);

      res.status(200).json(categories);

    } catch (error) {

      next(error);

    }

  },

};


