import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryPartsTable1788585741842 implements MigrationInterface {
    name = 'CreateInventoryPartsTable1788585741842'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`inventory_parts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`partNumber\` varchar(100) NOT NULL, \`name\` varchar(255) NOT NULL, \`category\` enum ('DISPLAY', 'BATTERY', 'MOTHERBOARD', 'CAMERA', 'CHASSIS', 'FLEX_CABLE', 'SPEAKER', 'CHARGING_PORT', 'MISC') NOT NULL DEFAULT 'MISC', \`unitOfMeasure\` varchar(50) NOT NULL DEFAULT 'UNIDAD', \`stockQuantity\` int NOT NULL DEFAULT '0', \`minimumStock\` int NOT NULL DEFAULT '5', \`unitCost\` decimal(10,2) NOT NULL DEFAULT '0.00', \`warehouseName\` varchar(150) NOT NULL DEFAULT 'Almacén Principal', \`locationBin\` varchar(100) NULL, \`notes\` text NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, INDEX \`IDX_ea2bcf1109feb4228607f08e8a\` (\`warehouseName\`), INDEX \`IDX_747cfd9fbe23587109f299e7ed\` (\`category\`), UNIQUE INDEX \`IDX_3cf3092f2dc8addbd49cfb692a\` (\`partNumber\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_3cf3092f2dc8addbd49cfb692a\` ON \`inventory_parts\``);
        await queryRunner.query(`DROP INDEX \`IDX_747cfd9fbe23587109f299e7ed\` ON \`inventory_parts\``);
        await queryRunner.query(`DROP INDEX \`IDX_ea2bcf1109feb4228607f08e8a\` ON \`inventory_parts\``);
        await queryRunner.query(`DROP TABLE \`inventory_parts\``);
    }
}
