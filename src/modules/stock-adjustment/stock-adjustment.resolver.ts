import { Args, ID, Query, Resolver } from "@nestjs/graphql";
import { Auth, User } from "src/common/decorator";
import { RoleEnum } from "src/common/enum";
import { StockAdjustmentService } from "./stock-adjustment.service";
import { ObjectIdPipe } from "src/common/pipe";
import { Types } from "mongoose";
import type{ HUserDocument } from "src/DB/models";
import { OneMessageResponse } from "./entities/stock-adjustment.entity";

@Resolver()
@Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
export class StockAdjustmentResolver {
    constructor(private readonly stockAdjustmentService : StockAdjustmentService){}
    @Query(()=>OneMessageResponse)
    async approve(@Args('stockAdjustmentId', ({type : ()=> ID}) , ObjectIdPipe) stockAdjustmentId : Types.ObjectId , @User() user : HUserDocument):Promise<OneMessageResponse>{
        return await this.stockAdjustmentService.approve(stockAdjustmentId , user)
    }
}