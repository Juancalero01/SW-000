import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTechnicalServiceTables1788587507691 implements MigrationInterface {
    name = 'CreateTechnicalServiceTables1788587507691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`technical_service_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`technicalServiceOrderId\` int NOT NULL, \`partId\` int NOT NULL, \`quantityUsed\` int NOT NULL, \`unitCost\` decimal(10,2) NOT NULL, \`subtotal\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`technical_service_orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`orderNumber\` varchar(50) NOT NULL, \`customerDeviceId\` int NOT NULL, \`clientId\` int NOT NULL, \`assignedTechnicianId\` int NULL, \`status\` enum ('RECEIVED', 'DIAGNOSING', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'RECEIVED', \`reportedIssue\` text NOT NULL, \`diagnosticNotes\` text NULL, \`repairNotes\` text NULL, \`laborCost\` decimal(10,2) NOT NULL DEFAULT '0.00', \`partsCost\` decimal(10,2) NOT NULL DEFAULT '0.00', \`totalCost\` decimal(10,2) NOT NULL DEFAULT '0.00', \`receivedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`completedAt\` timestamp NULL, \`deliveredAt\` timestamp NULL, INDEX \`IDX_cb89329d11693394af192b0ce9\` (\`assignedTechnicianId\`), INDEX \`IDX_e61f99809828dadb77342f8b0e\` (\`clientId\`), INDEX \`IDX_8afc8a6837091539bb7abfed90\` (\`customerDeviceId\`), INDEX \`IDX_ed99fb0a8ce369f52db4e7c950\` (\`status\`), UNIQUE INDEX \`IDX_47fbb33305e765f49f973b7a5d\` (\`orderNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`technical_service_items\` ADD CONSTRAINT \`FK_377a9c0104e8add9c17f03f5633\` FOREIGN KEY (\`technicalServiceOrderId\`) REFERENCES \`technical_service_orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`technical_service_items\` ADD CONSTRAINT \`FK_ca65151315e8ff74522bad4e603\` FOREIGN KEY (\`partId\`) REFERENCES \`inventory_parts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`technical_service_orders\` ADD CONSTRAINT \`FK_8afc8a6837091539bb7abfed901\` FOREIGN KEY (\`customerDeviceId\`) REFERENCES \`customer_devices\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`technical_service_orders\` ADD CONSTRAINT \`FK_e61f99809828dadb77342f8b0e3\` FOREIGN KEY (\`clientId\`) REFERENCES \`clients\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`technical_service_orders\` ADD CONSTRAINT \`FK_cb89329d11693394af192b0ce92\` FOREIGN KEY (\`assignedTechnicianId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`technical_service_orders\` DROP FOREIGN KEY \`FK_cb89329d11693394af192b0ce92\``);
        await queryRunner.query(`ALTER TABLE \`technical_service_orders\` DROP FOREIGN KEY \`FK_e61f99809828dadb77342f8b0e3\``);
        await queryRunner.query(`ALTER TABLE \`technical_service_orders\` DROP FOREIGN KEY \`FK_8afc8a6837091539bb7abfed901\``);
        await queryRunner.query(`ALTER TABLE \`technical_service_items\` DROP FOREIGN KEY \`FK_ca65151315e8ff74522bad4e603\``);
        await queryRunner.query(`ALTER TABLE \`technical_service_items\` DROP FOREIGN KEY \`FK_377a9c0104e8add9c17f03f5633\``);
        await queryRunner.query(`DROP INDEX \`IDX_47fbb33305e765f49f973b7a5d\` ON \`technical_service_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_ed99fb0a8ce369f52db4e7c950\` ON \`technical_service_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_8afc8a6837091539bb7abfed90\` ON \`technical_service_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_e61f99809828dadb77342f8b0e\` ON \`technical_service_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb89329d11693394af192b0ce9\` ON \`technical_service_orders\``);
        await queryRunner.query(`DROP TABLE \`technical_service_orders\``);
        await queryRunner.query(`DROP TABLE \`technical_service_items\``);
    }

}
