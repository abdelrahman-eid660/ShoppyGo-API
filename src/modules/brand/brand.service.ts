import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BrandDto } from './dto/create-brand.dto';
import { BrandRepository } from 'src/DB/Repository';
import { HUserDocument } from 'src/DB/models';
import {  IBrand, IPagination } from 'src/common/interface';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { BrandSortEnum, SortEnum } from 'src/common/enum';
import { S3Service } from 'src/common/service';
import { PaginationDTO } from 'src/common/dto';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);
  constructor(private readonly brandRepository : BrandRepository, private readonly s3 : S3Service){}
  async createBrand({logo , name}: BrandDto , user : HUserDocument) : Promise<IBrand> {
    const brandExist = await this.brandRepository.findOne({filter : {name , paranoid : false}})
    if (brandExist) {
      throw new ConflictException("This Brand already exists")
    }
    const brand = await this.brandRepository.create({data : {logo , name , createdBy : user._id }})
    return brand
  }
  async updateBrand({logo , name}: BrandDto , user : HUserDocument , brandId : string) : Promise<IBrand> {
    const _id = TransformToObjectId(brandId);
    const existing = await this.brandRepository.findOne({filter: {name , _id: { $ne: _id } , paranoid : false}});
    if (existing) {
      throw new ConflictException('Brand name already exists');
    }
    const brand = await this.brandRepository.findOneAndUpdate({filter : {_id},update : {name , logo , updatedBy:  user._id},options:{returnDocument : 'before'}})
    if (!brand) {
      throw new NotFoundException("Brand not found")
    }
    const oldLogo = brand.logo
    if (logo) {
      if (logo && oldLogo && logo !== oldLogo) {
        void this.s3.deleteAsset({ Key: oldLogo }).catch(err => {this.logger.error(err);});
      }
    }
    return brand
  }
  async allBrands(query:PaginationDTO) : Promise<{data : IPagination<IBrand>}> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST} = query || {};
    const skip = (page - 1) * limit
    const sortOption = BrandSortEnum[sort] || BrandSortEnum[SortEnum.NEWEST]
    const brands = await this.brandRepository.find({projection : "name logo slug" , options : {limit ,skip ,sort : sortOption}})
    if (!brands.length) {
      throw new NotFoundException("Brands not Found")
    }
    const totalDocs = await this.brandRepository.countDocuments({})
    const totalPages = Math.ceil(totalDocs / limit)
    return {
      data : {
      docs : brands , 
      pagination : {
        currentPage : page,
        limit,
        totalDocs,
        totalPages,
        hasNextPage : page < totalPages,
        hasPreviousPage : page > 1
      } 
    }}
  }
  async AllBrandsArchive(query : PaginationDTO) : Promise<IPagination<IBrand>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST} = query || {};
    const sortOption = BrandSortEnum[sort] || BrandSortEnum[SortEnum.NEWEST]
    const brands = await this.brandRepository.paginate({filter : {deletedAt : {$exists : true} , paranoid : false} , limit , page , sort : sortOption})
    if (!brands.docs.length) {
      throw new NotFoundException("there aren't any brands in archive")
    }
    return brands;
  }
  async getBrand(brandId: string):Promise<IBrand> {
    const brand = await this.brandRepository.findOne({filter : {_id :TransformToObjectId(brandId) , paranoid : false} , options : {populate : [{path : "createdBy" , select : "firstName lastName"},{path : "updatedBy" , select : "firstName lastName"}]}})
    if (!brand) {
      throw new NotFoundException("Brand not found")
    }
    return brand
  }
  async softDelete(brandId: string) : Promise<string> {
    const brand = await this.brandRepository.findOneAndUpdate({filter : {_id : TransformToObjectId(brandId)},update : {deletedAt : Date.now()},options : {returnDocument : "after"}})
    if (!brand) {
      throw new NotFoundException("Brand not found")
    } 
    return 'Brand moved to archieve successfuly'
  }
  async restore(brandId: string) : Promise<string> {
    const brand = await this.brandRepository.findOneAndUpdate({filter : {_id : TransformToObjectId(brandId) , paranoid : false},update : {restoredAt : Date.now()},options : {returnDocument : "after"}})    
    if (!brand) {
      throw new NotFoundException("Brand not found or not soft delete")
    }
    return 'Brand restored successfuly'
  }
  async removeBrand(brandId: string) : Promise<string> {
    const brand = await this.brandRepository.findOneAndDelete({filter : {_id : TransformToObjectId(brandId) , force : true},options : {returnDocument : "before"}})
    if (!brand) {
      throw new NotFoundException("Brand not found")
    }
    try {
      void this.s3.deleteAsset({Key : brand.logo})
    } catch (error : any) {
      throw new BadRequestException("Fail to delete logo from s3" , error.message)
    }
    return 'Brand deleted successfuly'
  }
}
 