import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePurchasesTables1788586232127 implements MigrationInterface {
    name = 'CreatePurchasesTables1788586232127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`purchase_order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`purchaseOrderId\` int NOT NULL, \`partId\` int NOT NULL, \`quantityOrdered\` int NOT NULL, \`quantityReceived\` int NOT NULL DEFAULT '0', \`unitCost\` decimal(10,2) NOT NULL, \`subtotal\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`purchase_orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`orderNumber\` varchar(50) NOT NULL, \`supplierId\` int NOT NULL, \`status\` enum ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT', \`targetWarehouse\` varchar(150) NOT NULL DEFAULT 'Almacén Principal', \`totalAmount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`notes\` text NULL, \`expectedDeliveryDate\` timestamp NULL, \`receivedAt\` timestamp NULL, INDEX \`IDX_29a82c7b4bb4e11a95a1506632\` (\`targetWarehouse\`), INDEX \`IDX_5272ac3aa931eedb14cd8789d6\` (\`status\`), UNIQUE INDEX \`IDX_0a4ef1738b13da938b62393dc0\` (\`orderNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` ADD CONSTRAINT \`FK_1de7eb246940b05765d2c99a7ec\` FOREIGN KEY (\`purchaseOrderId\`) REFERENCES \`purchase_orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` ADD CONSTRAINT \`FK_e6a5878c354418c7ea6f803a09d\` FOREIGN KEY (\`partId\`) REFERENCES \`inventory_parts\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`purchase_orders\` ADD CONSTRAINT \`FK_0c3ff892a9f2ed16f59d31cccae\` FOREIGN KEY (\`supplierId\`) REFERENCES \`suppliers\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`purchase_orders\` DROP FOREIGN KEY \`FK_0c3ff892a9f2ed16f59d31cccae\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` DROP FOREIGN KEY \`FK_e6a5878c354418c7ea6f803a09d\``);
        await queryRunner.query(`ALTER TABLE \`purchase_order_items\` DROP FOREIGN KEY \`FK_1de7eb246940b05765d2c99a7ec\``);
        await queryRunner.query(`DROP INDEX \`IDX_0a4ef1738b13da938b62393dc0\` ON \`purchase_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_5272ac3aa931eedb14cd8789d6\` ON \`purchase_orders\``);
        await queryRunner.query(`DROP INDEX \`IDX_29a82c7b4bb4e11a95a1506632\` ON \`purchase_orders\``);
        await queryRunner.query(`DROP TABLE \`purchase_orders\``);
        await queryRunner.query(`DROP TABLE \`purchase_order_items\``);
    }

}
