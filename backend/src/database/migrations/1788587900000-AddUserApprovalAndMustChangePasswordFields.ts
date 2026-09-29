import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserApprovalAndMustChangePasswordFields1788587900000 implements MigrationInterface {
    name = 'AddUserApprovalAndMustChangePasswordFields1788587900000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` ` +
            `ADD \`approvalStatus\` enum('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED', ` +
            `ADD \`mustChangePassword\` tinyint NOT NULL DEFAULT 0`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` ` +
            `DROP COLUMN \`mustChangePassword\`, ` +
            `DROP COLUMN \`approvalStatus\``
        );
    }
}
