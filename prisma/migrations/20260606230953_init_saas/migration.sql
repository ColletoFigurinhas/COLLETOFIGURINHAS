-- CreateTable
CREATE TABLE `empresas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `cor_primaria` VARCHAR(191) NOT NULL DEFAULT '#1d4ed8',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `plano` VARCHAR(191) NOT NULL DEFAULT 'basico',
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `empresas_slug_key`(`slug`),
    UNIQUE INDEX `empresas_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `super_admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `senha_hash` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `super_admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `participantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresa_id` INTEGER NOT NULL,
    `matricula` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `senha` VARCHAR(191) NULL,
    `role` ENUM('PARTICIPANTE', 'MARKETING', 'TI', 'ADMIN') NOT NULL DEFAULT 'PARTICIPANTE',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `data_entrada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reset_token` VARCHAR(191) NULL,
    `reset_token_expiry` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `participantes_reset_token_key`(`reset_token`),
    INDEX `participantes_empresa_id_idx`(`empresa_id`),
    UNIQUE INDEX `participantes_empresa_id_matricula_key`(`empresa_id`, `matricula`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campanhas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresa_id` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `data_inicio` DATETIME(3) NOT NULL,
    `data_fim` DATETIME(3) NOT NULL,
    `stickers_por_dia_padrao` INTEGER NOT NULL DEFAULT 14,
    `stickers_por_dia_plus` INTEGER NOT NULL DEFAULT 15,
    `stickers_por_dia_premium` INTEGER NOT NULL DEFAULT 15,
    `chance_especial` DOUBLE NOT NULL DEFAULT 0.10,
    `horario_corte_acoes` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ativo',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `campanhas_empresa_id_idx`(`empresa_id`),
    UNIQUE INDEX `campanhas_empresa_id_slug_key`(`empresa_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `figurinhas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campanha_id` INTEGER NOT NULL,
    `classificacao` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'FUNCIONARIO',
    `imagem_url` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `album_itens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `participante_id` INTEGER NOT NULL,
    `figurinha_id` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `primeira_vez_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quantidade_entregue` INTEGER NOT NULL DEFAULT 0,
    `entregue_em` DATETIME(3) NULL,
    `entregue_by` VARCHAR(191) NULL,

    UNIQUE INDEX `album_itens_participante_id_figurinha_id_key`(`participante_id`, `figurinha_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacotes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campanha_id` INTEGER NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `tipo` ENUM('PADRAO', 'PLUS', 'PREMIUM') NOT NULL DEFAULT 'PADRAO',
    `data_referencia` DATETIME(3) NOT NULL,
    `aberto_em` DATETIME(3) NULL,
    `status` ENUM('DISPONIVEL', 'ABERTO') NOT NULL DEFAULT 'DISPONIVEL',
    `is_nivelamento` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pacotes_participante_id_campanha_id_idx`(`participante_id`, `campanha_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacote_figurinhas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacote_id` INTEGER NOT NULL,
    `figurinha_id` INTEGER NOT NULL,
    `revelada` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `premios_fisicos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacote_id` INTEGER NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `registrado_por` VARCHAR(191) NOT NULL,
    `notificado_em` DATETIME(3) NULL,
    `entregue_em` DATETIME(3) NULL,
    `observacoes` VARCHAR(191) NULL,

    UNIQUE INDEX `premios_fisicos_pacote_id_key`(`pacote_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trocas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campanha_id` INTEGER NOT NULL,
    `solicitante_id` INTEGER NOT NULL,
    `figurinha_ofertada_id` INTEGER NOT NULL,
    `destinatario_id` INTEGER NOT NULL,
    `figurinha_recebida_id` INTEGER NULL,
    `status` ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA_SEM_FIGURINHA', 'CANCELADA_PELO_SOLICITANTE') NOT NULL DEFAULT 'PENDENTE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `respondido_em` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `acoes_campanha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campanha_id` INTEGER NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `data_acao` DATETIME(3) NOT NULL,
    `horario_corte` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs_distribuicao_manual` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empresa_id` INTEGER NOT NULL,
    `pacote_id` INTEGER NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `participante_nome` VARCHAR(191) NOT NULL,
    `matricula` VARCHAR(191) NOT NULL,
    `tipo_pacote` ENUM('PADRAO', 'PLUS', 'PREMIUM') NOT NULL,
    `distribuido_por` VARCHAR(191) NOT NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `logs_distribuicao_manual_empresa_id_idx`(`empresa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ganhadores_acao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `acao_id` INTEGER NOT NULL,
    `participante_id` INTEGER NOT NULL,
    `tipo_pacote_premio` ENUM('PADRAO', 'PLUS', 'PREMIUM') NOT NULL,
    `registrado_por` VARCHAR(191) NOT NULL,
    `data_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `pacote_id` INTEGER NULL,

    UNIQUE INDEX `ganhadores_acao_acao_id_participante_id_key`(`acao_id`, `participante_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `participantes` ADD CONSTRAINT `participantes_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campanhas` ADD CONSTRAINT `campanhas_empresa_id_fkey` FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
