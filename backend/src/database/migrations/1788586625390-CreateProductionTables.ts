import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductionTables1788586625390 implements MigrationInterface {
    name = 'CreateProductionTables1788586625390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`production_order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`productionOrderId\` int NOT NULL, \`partId\` int NOT NULL, \`quantityRequiredPerUnit\` int NOT NULL, \`quantityConsumedTotal\` int NOT NULL DEFAULT '0', \`quantityScrapped\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`production_bom\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`productId\` int NOT NULL, \`partId\` int NOT NULL, \`quantityRequired\` int NOT NULL DEFAULT '1', \`notes\` text NULL, INDEX \`IDX_8b6c6b4055bb9d8581ff049f50\` (\`partId\`), INDEX \`IDX_1ae2d318693f8000213511148b\` (\`productId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`production_orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`productionNumber\` varchar(50) NOT NULL, \`productId\` int NOT NULL, \`quantityToProduce\` int NOT NULL, \`quantityProduced\` int NOT NULL DEFAULT '0', \`status\` enum ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED', \`sourceWarehouse\` varchar(150) NOT NULL DEFAULT 'Almacén Principal', \`targetWarehouse\` varchar(150) NOT NULL DEFAULT 'Almacén Principal', \`notes\` text NULL, \`startedAt\` timestamp NULL, \`completedAt\` timestamp NULL, INDEX \`IDX_824becee08d8b39c928e005b4a\` (\`targetWarehouse\`), INDEX \`IDX_4136b0764498a0c7e7ed4309bb\` (\`status\`), UNIQUE INDEX \`IDX_5f4dbd2c3767b56291fffaacb9\` (\`productionNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`production_order_items\` ADD CONSTRAINT \`FK_5a4980b8b1596a2c3f72c7a94f4\` FOREIGN KEY (\`productionOrderId\`) REFERENCES \`production_orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`production_order_items\` ADD CONSTRAINT \`FK_c95cd12d1a7592c3a3fb0bac18c\` FOREIGN KEY (\`partId\`) REFERENCES \`inventory_parts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`production_bom\` ADD CONSTRAINT \`FK_1ae2d318693f8000213511148b1\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`production_bom\` ADD CONSTRAINT \`FK_8b6c6b4055bb9d8581ff049f506\` FOREIGN KEY (\`partId\`) REFERENCES \`inventory_parts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`production_orders\` ADD CONSTRAINT \`FK_8584be8f232016b2c24a4e12589\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`production_orders\` DROP FOREIGN KEY \`FK_8584be8f232016b2c24a4e12589\``);
        await queryRunner.query(`ALTER TABLE \`production_bom\` DROP FOREIGN KEY \`FK_8b6c6b4055bb9d8581ff049f506\``);
        await queryRunner.query(`ALTER TABLE \`production_bom\` DROP FOREIGN KEY \`FK_1ae2d318693f8000213511148b1\``);
        await queryRunner.query(`ALTER TABLE \`production_order_items\` DROP FOREIGN KEY \`FK_c95cd12d1a7592c3a3fb0bac18c\``);
        await queryRunner.query(`ALTER TABLE \`production_order_items\` DROP FOREIGN KEY \`FK_5a4980b8b1596a2c3f72c7a94f4\``);
        await queryRunner.query(`DROP INDEX \`IDX_5f4dbd2c3767b56291fffaacb9\` ON \`production_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_4136b0764498a0c7e7ed4309bb\` ON \`production_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_824becee08d8b39c928e005b4a\` ON \`production_orders\``);
        await queryRunner.query(`DROP TABLE \`production_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_1ae2d318693f8000213511148b\` ON \`production_bom\``);
        await queryRunner.query(`DROP INDEX \`IDX_8b6c6b4055bb9d8581ff049f50\` ON \`production_bom\``);
        await queryRunner.query(`DROP TABLE \`production_bom\``);
        await queryRunner.query(`DROP TABLE \`production_order_items\``);
    }

}
