import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomerDevicesTables1788587250863 implements MigrationInterface {
    name = 'CreateCustomerDevicesTables1788587250863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`customer_devices\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`imei1\` varchar(15) NOT NULL, \`imei2\` varchar(15) NULL, \`serialNumber\` varchar(100) NOT NULL, \`productId\` int NOT NULL, \`clientId\` int NOT NULL, \`saleId\` int NULL, \`status\` enum ('ACTIVE', 'IN_REPAIR', 'REPLACED', 'DECOMMISSIONED') NOT NULL DEFAULT 'ACTIVE', \`warrantyStartDate\` date NULL, \`warrantyEndDate\` date NULL, \`notes\` text NULL, INDEX \`IDX_8e595c74547bae5115edfa5941\` (\`status\`), INDEX \`IDX_8944edb2459833e61c20754924\` (\`productId\`), INDEX \`IDX_7fcbe6cd0e82c02d712e1e1502\` (\`clientId\`), UNIQUE INDEX \`IDX_a697d27f2877cba58310b46c6e\` (\`imei1\`), UNIQUE INDEX \`IDX_0cf919e96611b8433189d95b7a\` (\`serialNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`customer_devices\` ADD CONSTRAINT \`FK_8944edb2459833e61c207549249\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer_devices\` ADD CONSTRAINT \`FK_7fcbe6cd0e82c02d712e1e1502f\` FOREIGN KEY (\`clientId\`) REFERENCES \`clients\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customer_devices\` ADD CONSTRAINT \`FK_bceb501da015eac74d6924df779\` FOREIGN KEY (\`saleId\`) REFERENCES \`sales\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`customer_devices\` DROP FOREIGN KEY \`FK_bceb501da015eac74d6924df779\``);
        await queryRunner.query(`ALTER TABLE \`customer_devices\` DROP FOREIGN KEY \`FK_7fcbe6cd0e82c02d712e1e1502f\``);
        await queryRunner.query(`ALTER TABLE \`customer_devices\` DROP FOREIGN KEY \`FK_8944edb2459833e61c207549249\``);
        await queryRunner.query(`DROP INDEX \`IDX_0cf919e96611b8433189d95b7a\` ON \`customer_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_a697d27f2877cba58310b46c6e\` ON \`customer_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_7fcbe6cd0e82c02d712e1e1502\` ON \`customer_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_8944edb2459833e61c20754924\` ON \`customer_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_8e595c74547bae5115edfa5941\` ON \`customer_devices\``);
        await queryRunner.query(`DROP TABLE \`customer_devices\``);
    }

}
