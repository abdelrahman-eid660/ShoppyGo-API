import { BaseRepository } from './base.repository';
import { IUser } from '../../common/interface/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../models';
import { Injectable } from '@nestjs/common';
@Injectable()
export class UserRepository extends BaseRepository<IUser> {
  constructor(@InjectModel(User.name) protected readonly model: Model<IUser>) {
    super(model);
  }
}
