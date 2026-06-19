import { HydratedDocument } from 'mongoose';

export interface IPagination<TRawDocument> {
  docs: HydratedDocument<TRawDocument>[];
  pagination: {
    currentPage?: number | undefined;
    limit: number;
    totalDocs?: number | undefined;
    totalPages?: number | undefined;
    hasNextPage: boolean | null;
    hasPreviousPage: boolean | null;
  };
}