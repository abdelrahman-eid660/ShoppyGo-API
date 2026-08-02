import { HUserDocument } from "src/DB/models";

export type OrderActor =  HUserDocument | { _id: string; role: 'SYSTEM'; name: string };