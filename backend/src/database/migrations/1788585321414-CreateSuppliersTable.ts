import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSuppliersTable1788585321414 implements MigrationInterface {
    name = 'CreateSuppliersTable1788585321414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`suppliers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`companyName\` varchar(255) NOT NULL, \`tradeName\` varchar(255) NULL, \`taxId\` varchar(50) NULL, \`contactName\` varchar(150) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(50) NOT NULL, \`address\` varchar(255) NULL, \`country\` varchar(100) NULL, \`paymentTerms\` enum ('CASH', 'NET_15', 'NET_30', 'NET_60', 'NET_90', 'ADVANCE_PAYMENT', 'OTHER') NOT NULL DEFAULT 'CASH', \`notes\` text NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, INDEX \`IDX_f72076dc070721b49096875368\` (\`paymentTerms\`), INDEX \`IDX_d154f00bfee84e61e2c7b4d46a\` (\`country\`), INDEX \`IDX_80db1870745ff8145031e06615\` (\`companyName\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_80db1870745ff8145031e06615\` ON \`suppliers\``);
        await queryRunner.query(`DROP INDEX \`IDX_d154f00bfee84e61e2c7b4d46a\` ON \`suppliers\``);
        await queryRunner.query(`DROP INDEX \`IDX_f72076dc070721b49096875368\` ON \`suppliers\``);
        await queryRunner.query(`DROP TABLE \`suppliers\``);
    }

}
