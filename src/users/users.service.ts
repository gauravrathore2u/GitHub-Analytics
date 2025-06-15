import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';
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
    // Remove githubId usage, use username as unique identifier
    const { username, ...rest } = userData;
    const user = await this.userModel.findOneAndUpdate(
      { username },
      { ...rest, updatedAt: new Date() },
      { upsert: true, new: true },
    );
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findOne({ _id: id }).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  getAccessToken(user: User): string {
    return user.accessToken;
  }

  async signup({
    username,
    password,
    githubPat,
  }: {
    username: string;
    password: string;
    githubPat: string;
  }): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(password, 10);
    const encryptedPat = encrypt(githubPat);
    const user = new this.userModel({
      username,
      passwordHash,
      encryptedPat,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return user.save();
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  getDecryptedPat(user: User): string {
    return decrypt(user.encryptedPat);
  }

  // Update the user's accessToken and updatedAt fields
  async updateAccessToken(userId: string, accessToken: string): Promise<void> {
    // Ensure userId is a valid ObjectId
    const objectId = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    await this.userModel.findByIdAndUpdate(
      objectId,
      { accessToken, updatedAt: new Date() },
      { new: true },
    );
  }
}
