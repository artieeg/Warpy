-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "is_anon" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "avatar" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "sub" DROP NOT NULL;
