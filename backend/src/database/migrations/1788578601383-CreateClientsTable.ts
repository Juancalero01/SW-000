import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClientsTable1788578601383 implements MigrationInterface {
    name = 'CreateClientsTable1788578601383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`clients\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`clientType\` enum ('INDIVIDUAL', 'COMPANY') NOT NULL, \`taxId\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`tradeName\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(255) NULL, \`address\` varchar(255) NULL, \`city\` varchar(255) NULL, \`state\` varchar(255) NULL, \`country\` varchar(255) NULL DEFAULT 'Argentina', \`contactName\` varchar(255) NULL, \`contactRole\` varchar(255) NULL, \`contactEmail\` varchar(255) NULL, \`contactPhone\` varchar(255) NULL, \`creditLimit\` decimal(12,2) NOT NULL DEFAULT '0.00', \`status\` enum ('PROSPECT', 'LEAD', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'PROSPECT', \`notes\` text NULL, UNIQUE INDEX \`IDX_CLIENTS_TAX_ID\` (\`taxId\`), INDEX \`IDX_CLIENTS_EMAIL\` (\`email\`), UNIQUE INDEX \`IDX_be60a72fe1183a9f7ba93c759c\` (\`taxId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_be60a72fe1183a9f7ba93c759c\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_CLIENTS_EMAIL\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_CLIENTS_TAX_ID\` ON \`clients\``);
        await queryRunner.query(`DROP TABLE \`clients\``);
    }

}
