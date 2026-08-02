import { ProductVariantRepository } from 'src/DB/Repository';
import { StockAlertRepository } from './../../DB/Repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AllStockAlerts, CreateStockAlertDto, UpdateStockAlertDto } from './dto';
import { HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IPagination, IStockAlert } from 'src/common/interface';
import { SharedSortEnum, SortEnum } from 'src/common/enum';

@Injectable()
export class StockAlertService {
  constructor(
    private readonly stockAlertRepository : StockAlertRepository,
    private readonly productVariantRepository : ProductVariantRepository
  ){}
  
  async create({productVariantId}: CreateStockAlertDto , user : HUserDocument) : Promise<string> {
    productVariantId = TransformToObjectId(productVariantId as unknown as string)
    const variantExists = await this.productVariantRepository.findOne({filter : {_id : productVariantId , stock : {$lte : 0}}})
    if(!variantExists){
      throw new BadRequestException(`There is aculty stocks for this product ${productVariantId.toString()}`)
    }
    const stockAlertExists = await this.stockAlertRepository.findOne({filter : {productVariantId , createdBy : user._id}})
    if(stockAlertExists){
      throw new BadRequestException(`You have already enable stock alret for this product ${productVariantId.toString()}`)
    }
    await this.stockAlertRepository.create({data : {createdBy : user._id, variantSnapshot : variantExists.sku , productVariantId , isNotified : false}})
    return `Stock alret enable successfuly for this product ${productVariantId.toString()}`;
  }

  async findAll(query : AllStockAlerts):Promise<IPagination<IStockAlert>> {
    const {limit = 4 , page , sort = SortEnum.NEWEST , search } = query
    const sortOptions = SharedSortEnum[sort] || SharedSortEnum[SortEnum.NEWEST]
    const stockAlerts = await this.stockAlertRepository.paginate({
      filter : {...(search) && {variantSnapshot : new RegExp(search , 'i')}},
      limit , page , sort : sortOptions , options : {populate : [
        {path : "createdBy" , select : "firstName lastName"}]}
    })
    return stockAlerts
  }

  async findOne(stockId: Types.ObjectId) : Promise<IStockAlert> {
    const stockAlert = await this.stockAlertRepository.findOne({filter : {_id : stockId} ,
      options : {populate : [
      {path : "createdBy" , select : "firstName lastName role profileImage email"} ,
      {path : "productVariantId" , select : "images"}]}})
    if(!stockAlert){
      throw new NotFoundException(`This stock alert ${stockId.toString()} not found`)
    }
    return stockAlert
  }

  async update(stockId: Types.ObjectId, {productVariantId}: UpdateStockAlertDto , user : HUserDocument) : Promise<string> {
    productVariantId = TransformToObjectId(productVariantId as unknown as string)
    const stockAlert = await this.stockAlertRepository.findOneAndDelete({filter : {_id : stockId ,  createdBy : user._id, productVariantId}})
    return `Stock alret disable successfuly for this product ${productVariantId.toString()}`;
  }

}
