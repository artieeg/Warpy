import { UserBlock as PrismaUserBlock, User, PrismaClient } from '@prisma/client';
import { UserBlock } from '@warpy/lib';
import { toUserDTO } from '@warpy-be/app';

function toBlockDTO(data: (PrismaUserBlock & { blocked?: User }) | null): UserBlock {
  if (!data) {
    throw new Error('Block is null');
  }

  if (!data.blocked) {
    throw new Error('Blocked user data is null');
  }

  return {
    id: data.id,
    blocked: toUserDTO(data.blocked),
    blocker: data.blocker_id,
  };
}

export class UserBlockStore {
  constructor(private prisma: PrismaClient) {}
  async create({
    blocker,
    blocked,
  }: {
    blocker: string;
    blocked: string;
  }): Promise<string> {
    const { id } = await this.prisma.userBlock.create({
      data: {
        blocker_id: blocker,
        blocked_id: blocked,
      },
      select: {
        id: true,
      },
    });

    return id;
  }

  async deleteByUsers(blocker_id: string, blocked_id: string) {
    await this.prisma.userBlock.delete({
      where: {
        blocked_index: {
          blocked_id,
          blocker_id,
        },
      },
    });
  }

  /**
   * Returns ids of the users, who blocked us
   */
  async getBlockedByIds(user: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        blocked_id: user,
      },
      select: {
        blocker_id: true,
      },
    });

    return blocks.map((block) => block.blocker_id);
  }

  /**
   * Returns ids of users blocked by us
   */
  async getBlockedUserIds(user: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        blocker_id: user,
      },
      select: {
        blocked_id: true,
      },
    });

    return blocks.map((block) => block.blocked_id);
  }

  /**
   * Returns blocks that are made by us
   */
  async getBlockedUsers(user: string): Promise<UserBlock[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        blocker_id: user,
      },
      include: {
        blocked: true,
      },
    });

    return blocks.map(toBlockDTO);
  }
}
