/*
  Warnings:

  - The primary key for the `acoes_campanha` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `acoes_campanha` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `campanha_id` on the `acoes_campanha` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `album_itens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `album_itens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `participante_id` on the `album_itens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `figurinha_id` on the `album_itens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `campanhas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `campanhas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `figurinhas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `tipo` on the `figurinhas` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `figurinhas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `campanha_id` on the `figurinhas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `ganhadores_acao` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `ganhadores_acao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `acao_id` on the `ganhadores_acao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `participante_id` on the `ganhadores_acao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `pacote_id` on the `ganhadores_acao` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `pacote_figurinhas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `pacote_figurinhas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `pacote_id` on the `pacote_figurinhas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `figurinha_id` on the `pacote_figurinhas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `pacotes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `nome` on the `pacotes` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `pacotes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `campanha_id` on the `pacotes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `participante_id` on the `pacotes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `participantes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `participantes` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `premios_fisicos` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `premios_fisicos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `pacote_id` on the `premios_fisicos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `trocas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `trocas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `campanha_id` on the `trocas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `solicitante_id` on the `trocas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `figurinha_ofertada_id` on the `trocas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `destinatario_id` on the `trocas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `figurinha_recebida_id` on the `trocas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `acoes_campanha` DROP FOREIGN KEY `acoes_campanha_campanha_id_fkey`;

-- DropForeignKey
ALTER TABLE `album_itens` DROP FOREIGN KEY `album_itens_figurinha_id_fkey`;

-- DropForeignKey
ALTER TABLE `album_itens` DROP FOREIGN KEY `album_itens_participante_id_fkey`;

-- DropForeignKey
ALTER TABLE `figurinhas` DROP FOREIGN KEY `figurinhas_campanha_id_fkey`;

-- DropForeignKey
ALTER TABLE `ganhadores_acao` DROP FOREIGN KEY `ganhadores_acao_acao_id_fkey`;

-- DropForeignKey
ALTER TABLE `ganhadores_acao` DROP FOREIGN KEY `ganhadores_acao_participante_id_fkey`;

-- DropForeignKey
ALTER TABLE `pacote_figurinhas` DROP FOREIGN KEY `pacote_figurinhas_figurinha_id_fkey`;

-- DropForeignKey
ALTER TABLE `pacote_figurinhas` DROP FOREIGN KEY `pacote_figurinhas_pacote_id_fkey`;

-- DropForeignKey
ALTER TABLE `pacotes` DROP FOREIGN KEY `pacotes_campanha_id_fkey`;

-- DropForeignKey
ALTER TABLE `pacotes` DROP FOREIGN KEY `pacotes_participante_id_fkey`;

-- DropForeignKey
ALTER TABLE `premios_fisicos` DROP FOREIGN KEY `premios_fisicos_pacote_id_fkey`;

-- DropForeignKey
ALTER TABLE `trocas` DROP FOREIGN KEY `trocas_campanha_id_fkey`;

-- DropForeignKey
ALTER TABLE `trocas` DROP FOREIGN KEY `trocas_destinatario_id_fkey`;

-- DropForeignKey
ALTER TABLE `trocas` DROP FOREIGN KEY `trocas_figurinha_ofertada_id_fkey`;

-- DropForeignKey
ALTER TABLE `trocas` DROP FOREIGN KEY `trocas_figurinha_recebida_id_fkey`;

-- DropForeignKey
ALTER TABLE `trocas` DROP FOREIGN KEY `trocas_solicitante_id_fkey`;

-- DropIndex
DROP INDEX `acoes_campanha_campanha_id_fkey` ON `acoes_campanha`;

-- DropIndex
DROP INDEX `album_itens_figurinha_id_fkey` ON `album_itens`;

-- DropIndex
DROP INDEX `figurinhas_campanha_id_fkey` ON `figurinhas`;

-- DropIndex
DROP INDEX `ganhadores_acao_participante_id_fkey` ON `ganhadores_acao`;

-- DropIndex
DROP INDEX `pacote_figurinhas_figurinha_id_fkey` ON `pacote_figurinhas`;

-- DropIndex
DROP INDEX `pacote_figurinhas_pacote_id_fkey` ON `pacote_figurinhas`;

-- DropIndex
DROP INDEX `pacotes_campanha_id_fkey` ON `pacotes`;

-- DropIndex
DROP INDEX `pacotes_participante_id_fkey` ON `pacotes`;

-- DropIndex
DROP INDEX `trocas_campanha_id_fkey` ON `trocas`;

-- DropIndex
DROP INDEX `trocas_destinatario_id_fkey` ON `trocas`;

-- DropIndex
DROP INDEX `trocas_figurinha_ofertada_id_fkey` ON `trocas`;

-- DropIndex
DROP INDEX `trocas_figurinha_recebida_id_fkey` ON `trocas`;

-- DropIndex
DROP INDEX `trocas_solicitante_id_fkey` ON `trocas`;

-- AlterTable
ALTER TABLE `acoes_campanha` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `campanha_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `album_itens` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `participante_id` INTEGER NOT NULL,
    MODIFY `figurinha_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `campanhas` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `figurinhas` DROP PRIMARY KEY,
    DROP COLUMN `tipo`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `campanha_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ganhadores_acao` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `acao_id` INTEGER NOT NULL,
    MODIFY `participante_id` INTEGER NOT NULL,
    MODIFY `pacote_id` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `pacote_figurinhas` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `pacote_id` INTEGER NOT NULL,
    MODIFY `figurinha_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `pacotes` DROP PRIMARY KEY,
    DROP COLUMN `nome`,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `campanha_id` INTEGER NOT NULL,
    MODIFY `participante_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `participantes` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `premios_fisicos` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `pacote_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `trocas` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `campanha_id` INTEGER NOT NULL,
    MODIFY `solicitante_id` INTEGER NOT NULL,
    MODIFY `figurinha_ofertada_id` INTEGER NOT NULL,
    MODIFY `destinatario_id` INTEGER NOT NULL,
    MODIFY `figurinha_recebida_id` INTEGER NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `figurinhas` ADD CONSTRAINT `figurinhas_campanha_id_fkey` FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `album_itens` ADD CONSTRAINT `album_itens_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `album_itens` ADD CONSTRAINT `album_itens_figurinha_id_fkey` FOREIGN KEY (`figurinha_id`) REFERENCES `figurinhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacotes` ADD CONSTRAINT `pacotes_campanha_id_fkey` FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacotes` ADD CONSTRAINT `pacotes_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacote_figurinhas` ADD CONSTRAINT `pacote_figurinhas_pacote_id_fkey` FOREIGN KEY (`pacote_id`) REFERENCES `pacotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacote_figurinhas` ADD CONSTRAINT `pacote_figurinhas_figurinha_id_fkey` FOREIGN KEY (`figurinha_id`) REFERENCES `figurinhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `premios_fisicos` ADD CONSTRAINT `premios_fisicos_pacote_id_fkey` FOREIGN KEY (`pacote_id`) REFERENCES `pacotes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trocas` ADD CONSTRAINT `trocas_campanha_id_fkey` FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trocas` ADD CONSTRAINT `trocas_solicitante_id_fkey` FOREIGN KEY (`solicitante_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trocas` ADD CONSTRAINT `trocas_figurinha_ofertada_id_fkey` FOREIGN KEY (`figurinha_ofertada_id`) REFERENCES `figurinhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trocas` ADD CONSTRAINT `trocas_destinatario_id_fkey` FOREIGN KEY (`destinatario_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trocas` ADD CONSTRAINT `trocas_figurinha_recebida_id_fkey` FOREIGN KEY (`figurinha_recebida_id`) REFERENCES `figurinhas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `acoes_campanha` ADD CONSTRAINT `acoes_campanha_campanha_id_fkey` FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ganhadores_acao` ADD CONSTRAINT `ganhadores_acao_acao_id_fkey` FOREIGN KEY (`acao_id`) REFERENCES `acoes_campanha`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ganhadores_acao` ADD CONSTRAINT `ganhadores_acao_participante_id_fkey` FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
