import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTable1788584144548 implements MigrationInterface {
    name = 'CreateProductsTable1788584144548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`products\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, \`sku\` varchar(100) NOT NULL, \`name\` varchar(255) NOT NULL, \`brand\` varchar(100) NOT NULL, \`model\` varchar(100) NOT NULL, \`operatingSystem\` enum ('ANDROID', 'IOS', 'OTHER') NOT NULL DEFAULT 'ANDROID', \`price\` decimal(10,2) NOT NULL, \`stock\` int NOT NULL DEFAULT '0', \`ramGb\` int NOT NULL, \`storageGb\` int NOT NULL, \`screenSizeInches\` decimal(4,2) NOT NULL, \`color\` varchar(50) NOT NULL, \`description\` text NULL, \`imageUrl\` varchar(500) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, INDEX \`IDX_75895eeb1903f8a17816dafe0a\` (\`price\`), INDEX \`IDX_8de18d406f9633183dea2908f9\` (\`operatingSystem\`), INDEX \`IDX_61fac54950763ae56ee51f17fd\` (\`brand\`), UNIQUE INDEX \`IDX_c44ac33a05b144dd0d9ddcf932\` (\`sku\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_c44ac33a05b144dd0d9ddcf932\` ON \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_61fac54950763ae56ee51f17fd\` ON \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_8de18d406f9633183dea2908f9\` ON \`products\``);
        await queryRunner.query(`DROP INDEX \`IDX_75895eeb1903f8a17816dafe0a\` ON \`products\``);
        await queryRunner.query(`DROP TABLE \`products\``);
    }
}
