import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetPasswordFieldsToUsersTable1788587800000 implements MigrationInterface {
    name = 'AddResetPasswordFieldsToUsersTable1788587800000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` ADD \`resetPasswordToken\` varchar(255) NULL, ADD \`resetPasswordExpires\` datetime NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP COLUMN \`resetPasswordExpires\`, DROP COLUMN \`resetPasswordToken\``
        );
    }
}
