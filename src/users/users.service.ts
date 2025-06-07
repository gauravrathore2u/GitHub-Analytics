import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createOrUpdate(userData: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    accessToken: string;
  }): Promise<User> {
    const { id, ...rest } = userData;
    const user = await this.userModel.findOneAndUpdate(
      { githubId: id },
      { ...rest, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return user;
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.userModel.findOne({ githubId }).exec();
  }

  getAccessToken(user: User): string {
    return user.accessToken;
  }
}
