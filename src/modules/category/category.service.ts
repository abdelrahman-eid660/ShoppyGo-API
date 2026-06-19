/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Types } from 'mongoose';
import { HUserDocument } from 'src/DB/models';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryRepository } from 'src/DB/Repository';
import { S3Service } from 'src/common/service';
import { PaginationDTO } from 'src/common/dto';
import { BrandSortEnum, SortEnum } from 'src/common/enum';
import { ICategory, IPagination } from 'src/common/interface';
import { TransformToObjectId } from 'src/common/utils/ObjectId';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(private readonly categoryRepository : CategoryRepository , private readonly s3 : S3Service){}
  async createCategory(user : HUserDocument , data: CreateCategoryDto) : Promise<ICategory> {
    const {name  , parentId} = data
    let ancestors : Types.ObjectId[] = []
    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne({filter : {_id : TransformToObjectId(parentId)}})
      if (!parentCategory) {
        throw new NotFoundException("Parent category not found")
      }
      ancestors = [...(parentCategory.ancestors ?? []),parentCategory._id] as Types.ObjectId[]
    }
    const categoryExist = await this.categoryRepository.findOne({filter : {name , paranoid : false}})
    if (categoryExist) {
      throw new ConflictException("This category already exists")
    }
    const category = await this.categoryRepository.create({data : {...data , createdBy : user._id , ancestors , parentId : parentId ? TransformToObjectId(parentId as string) : undefined}})
    if (!category) {
      if (data.image) {
        void this.s3.deleteAsset({Key : data.image}).catch(err => {this.logger.error(err)})
      }
    }
    return category;
  }
  async getAllCategories(query : PaginationDTO) : Promise<IPagination<ICategory>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NAME_ASC} = query || {};
    const sortOption = BrandSortEnum[sort] || BrandSortEnum[SortEnum.NEWEST]
    const categories = await this.categoryRepository.paginate({filter : {deletedAt : {$exists : false}} , limit , page , sort : sortOption , options : {populate : [{path : "ancestors" , select : "name image"}]}})
    if (!categories) {
      throw new NotFoundException("Categories not found")
    }
    return categories;
  }
  async getAllCategoriesArchive(query : PaginationDTO) : Promise<IPagination<ICategory>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST} = query || {};
    const sortOption = BrandSortEnum[sort] || BrandSortEnum[SortEnum.NEWEST]
    const categories = await this.categoryRepository.paginate({filter : {deletedAt : {$exists : true} , paranoid : false} , limit , page , sort : sortOption , options : {populate : [{path : "ancestors" , select : "name image"}]}})
    if (!categories.docs.length) {
      throw new NotFoundException("there aren't any Categories in archive")
    }
    return categories;
  }
  async getCategory(categoryId: string) : Promise<ICategory> {
    const category = await this.categoryRepository.findOne({filter : {_id :TransformToObjectId(categoryId) , paranoid : false} , options : {populate : [{path : "createdBy" , select : "firstName lastName"},{path : "updatedBy" , select : "firstName lastName"},{path : "ancestors" , select : "name image"}]}})
    if (!category) {
      throw new NotFoundException("category not found")
    }
    return category
  }
  async updateCategory(user : HUserDocument , categoryId: string, data: UpdateCategoryDto) {
    const _id = TransformToObjectId(categoryId);
    let ancestors : Types.ObjectId[] = []
    const {name , image , parentId} = data
    if (parentId && categoryId === parentId) {
      throw new ConflictException( "You can't set category as its own parent");
    }
    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne({filter : {_id : TransformToObjectId(parentId)}})
      if (!parentCategory) {
        throw new NotFoundException("Parent category not found'")
      }
      if (parentCategory._id.toString() === categoryId || parentCategory.ancestors?.some(id => id.toString() === categoryId)) {
        throw new ConflictException("you cant't to add toyr subCategory to your parentId")
      }
      ancestors = [...(parentCategory.ancestors ?? []),parentCategory._id] as Types.ObjectId[]
    }
    const existing = await this.categoryRepository.findOne({filter: {name , _id: { $ne: _id }}});
    if (existing) {
      throw new ConflictException('Category name already exists');
    }
    const category = await this.categoryRepository.findOneAndUpdate({filter : {_id},update : {name , parentId , ancestors , image , updatedBy:  user._id},options:{returnDocument : 'before'}})
    if (!category) {
      throw new NotFoundException("Category not found")
    }
    const oldImage = category.image
    if (image) {
      if (image && oldImage && image !== oldImage) {
        void this.s3.deleteAsset({ Key: oldImage }).catch(err => {this.logger.error(err)});
      }
    }
    return category
  }
  async softDelete(categoryId: string): Promise<string> {
    const _id  = TransformToObjectId(categoryId)
    const category = await this.categoryRepository.findOneAndUpdate({filter : {_id},update : {deletedAt : Date.now()},options : {returnDocument : "after"}})
    if (!category) {
      throw new NotFoundException("Category not found")
    }
    await this.categoryRepository.updateMany({filter:{$or : [{parentId : categoryId} , {ancestors : category._id}]},update:{$set :{deletedAt: Date.now()}}}) 
    return 'Category moved to archieve successfuly'
  }
  async restoreCategory(categoryId: string) : Promise<string> {
    const _id = TransformToObjectId(categoryId)
    const category = await this.categoryRepository.findOneAndUpdate({filter : {_id , paranoid : false},update : {restoredAt : Date.now()},options : {returnDocument : "after"}})    
    if (!category) {
      throw new NotFoundException("Category not found or not soft delete")
    }
    await this.categoryRepository.updateMany({filter:{$or : [{parentId : categoryId} , {ancestors : category._id}]},update:{$unset: { deletedAt: 1 }}}) 
    return 'Category restored successfuly'
  }
  async removeCategory(categoryId: string) : Promise<string> {
    const category = await this.categoryRepository.findOneAndDelete({filter : {_id : TransformToObjectId(categoryId) , force : true},options : {returnDocument : "before"}})
      if (!category) {
        throw new NotFoundException("Category not found")
      }
      if (category.image) {
        void this.s3.deleteAsset({ Key: category.image }).catch(err => {this.logger.error(err);});
        void this.categoryRepository.deleteMany({filter:{$or : [{parentId : categoryId} , {ancestors : category._id}] , force : true}}) 
      }
      return 'Category deleted successfuly'
  }
}
