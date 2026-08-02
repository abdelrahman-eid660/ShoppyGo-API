import {
  AnyBulkWriteOperation,
  AnyKeys,
  ClientSession,
  CreateOptions,
  DeleteResult,
  FlattenMaps,
  HydratedDocument,
  Model,
  MongooseBaseQueryOptions,
  MongooseBulkWriteOptions,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  Query,
  QueryFilter,
  QueryOptions,
  QueryWithHelpers,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from 'mongoose';
import { AggregateOptions } from 'node:sqlite';
import { IPagination } from '../../common/interface';
import { Injectable } from '@nestjs/common';
import  mongodb  from "mongodb";
@Injectable()
export abstract class BaseRepository<TRawDocument> {
  constructor(protected readonly model: Model<TRawDocument>) {}
  async create({data}: {data: AnyKeys<TRawDocument>}): Promise<HydratedDocument<TRawDocument>>;
  async create({data,options}: {data: AnyKeys<TRawDocument>[] , options?: CreateOptions;}): Promise<HydratedDocument<TRawDocument>[]>;
  async create({data,options}: {data: AnyKeys<TRawDocument>[] | AnyKeys<TRawDocument>,options?: CreateOptions}): Promise<HydratedDocument<TRawDocument>[] | HydratedDocument<TRawDocument>> {
    return await this.model.create(data as any, options);
  }
  async createOne({
    data,
    options,
  }: {
    data: AnyKeys<TRawDocument>;
    options?: CreateOptions;
  }): Promise<HydratedDocument<TRawDocument>> {
    const [doc] = await this.model.create([data] as any, options);
    return doc as HydratedDocument<TRawDocument>;
  }
  async find({
    filter,
    projection,
    options,
  }: {
    filter?: QueryFilter<TRawDocument>;
    projection?: ProjectionType<TRawDocument>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TRawDocument>[]> {
    return await this.model.find(filter || {}, projection, options);
  }
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocument>;
    projection?: ProjectionType<TRawDocument> | null | undefined;
    options?: QueryOptions<TRawDocument> & {
      lean?: false;
      populate?: PopulateOptions[];
    };
  }): Promise<HydratedDocument<TRawDocument> | null>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocument>;
    projection?: ProjectionType<TRawDocument> | null | undefined;
    options?: QueryOptions<TRawDocument> & {
      lean?: true;
      populate?: PopulateOptions[];
    };
  }): Promise<FlattenMaps<TRawDocument> | null>;
  async findOne({
    filter,
    projection,
    options,
  }: {
    filter: QueryFilter<TRawDocument>;
    projection?: ProjectionType<TRawDocument> | null | undefined;
    options?: QueryOptions<TRawDocument>;
  }): Promise<
    HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null
  > {
    const doc = this.model.findOne(filter, projection);
    if (options?.lean) {
      doc.lean(options.lean);
    }
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }
  async findById({
    _id,
    projection,
    options,
  }: {
    _id: Types.ObjectId;
    projection?: ProjectionType<TRawDocument> | null | undefined;
    options?: QueryOptions<TRawDocument> & {
      lean?: false;
      populate?: PopulateOptions[] | string;
    };
  }): Promise<HydratedDocument<TRawDocument> | null>;
  async findById({
    _id,
    projection,
    options,
  }: {
    _id: Types.ObjectId;
    projection?: ProjectionType<TRawDocument> | null | undefined;
    options?: QueryOptions<TRawDocument> & {
      lean?: true;
      populate?: PopulateOptions[] | string;
    };
  }): Promise<FlattenMaps<TRawDocument> | null>;
  async findById({
    _id,
    projection,
    options,
  }: {
    _id: Types.ObjectId;
    projection?: ProjectionType<TRawDocument> | null | undefined;
    options?: QueryOptions<TRawDocument>;
  }): Promise<
    HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null
  > {
    const doc = this.model.findById(_id, projection);
    if (options?.lean) {
      doc.lean();
    }
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    return await doc.exec();
  }
  async paginate({
    filter,
    projection,
    options = {},
    page = undefined,
    limit = 5,
    sort,
  }: {
    filter?: QueryFilter<TRawDocument>;
    projection?: ProjectionType<TRawDocument>;
    options?: QueryOptions; // يفضل جعلها اختياري بـ ?
    page?: number | undefined;
    limit?: number | undefined;
    sort?: any;
  }): Promise<IPagination<TRawDocument>> {
    // 1. تحويل القيم لأرقام صريحة والتعامل مع الـ undefined أو الأرقام السلبية
    const numericPage = Number(page) > 0 ? Number(page) : 1;
    const numericLimit = Number(limit) > 0 ? Number(limit) : 5;

    // 2. حساب الـ skip وتعديل الـ options
    const skip = (numericPage - 1) * numericLimit;
    options.skip = skip;
    options.limit = numericLimit;
    options.sort = sort;

    // 3. جلب العدد الإجمالي (استخدمنا estimatedDocumentCount لو الفلتر فاضي للأداء، أو countDocuments لو فيه فلتر)
    const isFilterEmpty = !filter || Object.keys(filter).length === 0;
    const totalDocs = isFilterEmpty
      ? await this.model.estimatedDocumentCount()
      : await this.model.countDocuments(filter);

    const totalPages = Math.ceil(totalDocs / numericLimit);

    // 4. جلب البيانات من الداتابيز
    const docs = await this.model.find(filter || {}, projection, options);

    // 5. الـ Return المقفل تماماً بدون أي تايب إيرور
    return {
      docs,
      pagination: {
        currentPage: numericPage,
        limit: numericLimit,
        totalDocs,
        totalPages,
        hasNextPage: numericPage < totalPages,
        hasPreviousPage: numericPage > 1,
      },
    };
  }
  async softDeleteChildren(parentId: Types.ObjectId) {
    await this.model.updateMany(
      { parentId },
      { $set: { deletedAt: new Date() } }
    );
  }
  async restoreChildren(parentId: Types.ObjectId) {
    await this.model.updateMany({ parentId }, { $unset: { deletedAt: 1 } });
  }
  async HardDeleteChildren(parentId: Types.ObjectId) {
    await this.model.deleteMany(
      { parentId },
    );
  }
  async updateOne({
    filter = {},
    update,
    options,
  }: {
    filter: QueryFilter<HydratedDocument<TRawDocument>>;
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDocument> | null;
  }): Promise<UpdateWriteOpResult> {
    if (Array.isArray(update)) {
      update.push({ $set: { __v: { $add: ['$__v', 1] } } });
      return await this.model.updateOne(filter, update, {
        ...options,
        updatePipeline: true,
      });
    }
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options
    );
  }
  async updateMany({
    filter = {},
    update,
    options = {returnDocument : "after"},
  }: {
    filter: QueryFilter<TRawDocument>;
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TRawDocument>& {returnDocument?: 'before' | 'after'} & {session? : ClientSession} | null;
  }): Promise<UpdateWriteOpResult> {
    return await this.model.updateMany(
      filter,
      { ...update, $inc: { __v: 1 } },
      options
    );
  }
  async findOneAndUpdate({
    filter = {},
    update,
    options = { returnDocument: 'after' },
  }: {
    filter: QueryFilter<TRawDocument>;
    update: UpdateQuery<TRawDocument>;
    options?: QueryOptions<TRawDocument> & {
      returnDocument?: 'before' | 'after';
    };
  }): Promise<HydratedDocument<TRawDocument> | null> {
    if (Array.isArray(update)) {
      return await this.model.findOneAndUpdate(filter, update, {
        ...options,
        updatePipeline: true,
      });
    }
    return await this.model.findOneAndUpdate(filter, update, options);
  }
  async findByIdAndUpdate({
    _id,
    update,
    options = { returnDocument: 'after' },
  }: {
    _id: Types.ObjectId;
    update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline;
    options: QueryOptions<TRawDocument> & {
      returnDocument?: 'before' | 'after';
    };
  }): Promise<HydratedDocument<TRawDocument> | null> {
    if (Array.isArray(update)) {
      return await this.model.findByIdAndUpdate(_id, update, {
        ...options,
        updatePipeline: true,
      });
    }
    return await this.model.findByIdAndUpdate(_id, update, options);
  }
  async deleteOne({
    filter = {},
  }: {
    filter: QueryFilter<TRawDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }
  async deleteMany({
    filter = {},
    options = {}
  }: {
    filter: QueryFilter<TRawDocument>,
    options? :  (mongodb.DeleteOptions & MongooseBaseQueryOptions<TRawDocument>) & {session? : ClientSession} | null
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter , options);
  }
  async findOneAndDelete({
    filter = {},
    options,
  }: {
    filter: QueryFilter<TRawDocument>;
    options?: QueryOptions<TRawDocument>;
  }): Promise<HydratedDocument<TRawDocument> | null> {
    return await this.model.findOneAndDelete(filter, options);
  }
  async findByIdAndDelete({
    _id,
    options,
  }: {
    _id: Types.ObjectId;
    options?: QueryOptions<TRawDocument>;
  }): Promise<HydratedDocument<TRawDocument> | null> {
    return await this.model.findByIdAndDelete(_id, options);
  }
  async aggregate(
    pipeline: any[],
    options?: Partial<AggregateOptions> & { allowDeleted: boolean }
  ) {
    const Pipeline = pipeline.length ? pipeline : [{ $match: {} }];
    return this.model.aggregate(Pipeline, options);
  }
  async countDocuments({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocument>;
    options?: QueryOptions<TRawDocument>;
  }): Promise<
    QueryWithHelpers<
      number,
      HydratedDocument<TRawDocument>,
      TRawDocument,
      'countDocuments'
    >
  >;
  async countDocuments({
    filter,
    options,
  }: {
    filter?: QueryFilter<TRawDocument>;
    options?: QueryOptions<TRawDocument>;
  }): Promise<
    QueryWithHelpers<
      number,
      HydratedDocument<TRawDocument>,
      TRawDocument,
      'countDocuments'
    >
  >;
  async countDocuments({
    filter = {},
    options,
  }: {
    filter?: QueryFilter<TRawDocument> | undefined;
    options?: QueryOptions<TRawDocument>;
  }): Promise<
    | number
    | QueryWithHelpers<
        number,
        HydratedDocument<TRawDocument>,
        TRawDocument,
        'countDocuments'
      >
  > {
    return await this.model.countDocuments(filter, options as any);
  }
  async bulkWrite<DocContents = TRawDocument>(
    writes: Array<AnyBulkWriteOperation<DocContents extends mongodb.Document ? DocContents : any>>,
    options: mongodb.BulkWriteOptions & MongooseBulkWriteOptions & { ordered: boolean }
    ): Promise<mongodb.BulkWriteResult & { mongoose?: { validationErrors: Error[] } }>;
  async bulkWrite<DocContents = TRawDocument>(
        writes: Array<AnyBulkWriteOperation<DocContents extends mongodb.Document ? DocContents : any>>,
        options?: mongodb.BulkWriteOptions & MongooseBulkWriteOptions
      ): Promise<mongodb.BulkWriteResult>{
        return await this.model.bulkWrite(writes , options)
      }
}
