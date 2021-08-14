import { User } from "@prisma/client";
import { prisma } from "./client";

import { IBaseUser } from "@warpy/lib";

export interface IUser extends IBaseUser {
  email: string | null;
  sub: string | null;
}

type NewUserParams = Omit<Omit<User, "id">, "created_at">;

export const toUserDTO = (data: User, includeDetails: boolean): IUser => {
  return {
    id: data.id,
    last_name: data.last_name,
    first_name: data.first_name,
    username: data.username,
    avatar: data.avatar,
    sub: includeDetails ? data.sub : null,
    email: includeDetails ? data.email : null,
  };
};

export const UserDAL = {
  createNewUser: async (data: NewUserParams): Promise<User> => {
    const user = await prisma.user.create({
      data,
    });

    return user;
  },
  findById: async (
    id: string,
    details: boolean = false
  ): Promise<IUser | null> => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? toUserDTO(user, details) : null;
  },
  deleteById: (id: string): Promise<User> => {
    return prisma.user.delete({ where: { id } });
  },
};