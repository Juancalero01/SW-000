import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSalesTables1788586995750 implements MigrationInterface {
    name = 'CreateSalesTables1788586995750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sale_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`saleId\` int NOT NULL, \`productId\` int NOT NULL, \`quantity\` int NOT NULL, \`unitPrice\` decimal(10,2) NOT NULL, \`subtotal\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sales\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`saleNumber\` varchar(50) NOT NULL, \`clientId\` int NOT NULL, \`totalAmount\` decimal(10,2) NOT NULL, \`discountAmount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`taxAmount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`paymentMethod\` enum ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'OTHER') NOT NULL DEFAULT 'CASH', \`status\` enum ('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED', \`notes\` text NULL, \`soldAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX \`IDX_06fe4fb9bc3d3f9f2f8963a928\` (\`soldAt\`), INDEX \`IDX_2ec61d349b036d19965f9f7403\` (\`paymentMethod\`), INDEX \`IDX_83e1f4b8d3b863cce4846e0295\` (\`status\`), INDEX \`IDX_c0ae0d7fce67f97394e3a250a3\` (\`clientId\`), UNIQUE INDEX \`IDX_12c072f5150ca7d495b07aa1c6\` (\`saleNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`sale_items\` ADD CONSTRAINT \`FK_c642be08de5235317d4cf3deb40\` FOREIGN KEY (\`saleId\`) REFERENCES \`sales\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sale_items\` ADD CONSTRAINT \`FK_d675aea38a16313e844662c48f8\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sales\` ADD CONSTRAINT \`FK_c0ae0d7fce67f97394e3a250a33\` FOREIGN KEY (\`clientId\`) REFERENCES \`clients\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sales\` DROP FOREIGN KEY \`FK_c0ae0d7fce67f97394e3a250a33\``);
        await queryRunner.query(`ALTER TABLE \`sale_items\` DROP FOREIGN KEY \`FK_d675aea38a16313e844662c48f8\``);
        await queryRunner.query(`ALTER TABLE \`sale_items\` DROP FOREIGN KEY \`FK_c642be08de5235317d4cf3deb40\``);
        await queryRunner.query(`DROP INDEX \`IDX_12c072f5150ca7d495b07aa1c6\` ON \`sales\``);
        await queryRunner.query(`DROP INDEX \`IDX_c0ae0d7fce67f97394e3a250a3\` ON \`sales\``);
        await queryRunner.query(`DROP INDEX \`IDX_83e1f4b8d3b863cce4846e0295\` ON \`sales\``);
        await queryRunner.query(`DROP INDEX \`IDX_2ec61d349b036d19965f9f7403\` ON \`sales\``);
        await queryRunner.query(`DROP INDEX \`IDX_06fe4fb9bc3d3f9f2f8963a928\` ON \`sales\``);
        await queryRunner.query(`DROP TABLE \`sales\``);
        await queryRunner.query(`DROP TABLE \`sale_items\``);
    }

}
