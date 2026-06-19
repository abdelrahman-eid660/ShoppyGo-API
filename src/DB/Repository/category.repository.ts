import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base.repository";
import { ICategory } from "src/common/interface";
import { InjectModel } from "@nestjs/mongoose";
import { Category } from "../models";
import { Model, Types } from "mongoose";

@Injectable()
export class CategoryRepository extends BaseRepository<ICategory>{
    constructor(@InjectModel(Category.name) protected readonly model : Model<ICategory>){
        super(model)
    }
}