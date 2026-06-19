import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { S3Service } from 'src/common/service';
import { ProductRepository, CategoryRepository , BrandRepository } from 'src/DB/Repository';
import { HUserDocument } from 'src/DB/models';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IProduct } from 'src/common/interface';
import { ProductDto } from 'src/common/dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(
    private readonly productRepository: ProductRepository,
    readonly brandRepository: BrandRepository,
    readonly categoryRepository: CategoryRepository,
    private readonly s3: S3Service
  ) {}
  private async cleanUpProducts(data : ProductDto , product? : IProduct){
    if (product) {
      const oldImage = product?.image || ''
      const oldGallery = product?.gallery || []
      if (data.image) {
        await this.s3.deleteAsset({Key : oldImage}).catch(err => {this.logger.error(err)})
      }
      if (data.gallery?.length) {
        await this.s3.deleteAssets({Keys : oldGallery?.map(Key => ({Key}))}).catch(err => {this.logger.error(err)}) 
      }
    }else{
      if (data?.image) {
        await this.s3.deleteAsset({Key : data.image}).catch(err => {this.logger.error(err)})
      }
      if (data?.gallery?.length) {
        await this.s3.deleteAssets({Keys : data.gallery?.map(Key => ({Key}))}).catch(err => {this.logger.error(err)}) 
      }
    }
  }
  async create(data: ProductDto, user: HUserDocument) : Promise<IProduct> {
    const brandId = TransformToObjectId(data.brandId as unknown as string)
    const categoryId = TransformToObjectId(data.categoryId as unknown as string)
    const [brand, category] = await Promise.all([
      this.brandRepository.findOne({ filter: { _id: brandId } }),
      this.categoryRepository.findOne({ filter: { _id: categoryId } }),
    ]);
    if (!brand) throw new NotFoundException("Brand not found");
    if (!category) throw new NotFoundException("Category not found");
    const productExist = await this.productRepository.findOne({ filter: {title : data.title , brandId , categoryId , paranoid : false}});
    if (productExist) throw new ConflictException("Product already exists")
    const product = await this.productRepository.create({data : {...data, brandId , categoryId , createdBy : user._id}})
    if (!product) {
      void this.cleanUpProducts(data)
      throw new BadRequestException("Fail to crate this product")
    }
    return  product;
  }
  async update(ProductId: string, data: ProductDto, user: HUserDocument) : Promise<IProduct> {
    const {basePrice , description , title , attributes , gallery , image} = data
    const productId = TransformToObjectId(ProductId)
    const brandId = data.brandId ? TransformToObjectId(data.brandId as unknown as string) : null
    const categoryId = data.categoryId ?  TransformToObjectId(data.categoryId as unknown as string) : null
    if (title) {
      const productExist = await this.productRepository.findOne({filter : {title , _id : {$ne : productId}}})
      if (productExist) throw new ConflictException("This Product's title already exists") 
    }
    const [brand, category] = await Promise.all([
      brandId ? this.brandRepository.findOne({ filter: { _id: brandId } }) : null,
      categoryId ? this.categoryRepository.findOne({ filter: { _id: categoryId } }) : null,
    ]);
    if (!brand) throw new NotFoundException("Brand not found");
    if (!category) throw new NotFoundException("Category not found");
    const product = await this.productRepository.findOneAndUpdate({filter:{_id : productId} ,
      update : {$set : {basePrice , description , title , attributes , gallery , image , brandId , categoryId , updatedBy : user._id}},
      options : {returnDocument : "before"}})
    if (!product) throw new NotFoundException("Product not found")
    void this.cleanUpProducts(data , product)
    return  product;
  }

  findAll() {
    return `This action returns all product`;
  }

  findOne(productId: string) {
    return `This action returns a #${productId} product`;
  }
  async restore(productId: string) {
    return `This action returns a #${productId} product`;
  }
  async softDelete(productId: string) {
    return `This action returns a #${productId} product`;
  }

  async remove(productId: string) {
    return `This action removes a #${productId} product`;
  }
}
