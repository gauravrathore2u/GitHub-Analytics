import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  username!: string;

  @Prop()
  email!: string;

  @Prop()
  avatar!: string;

  @Prop()
  accessToken!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true })
  encryptedPat!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
