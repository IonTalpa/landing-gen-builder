-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sector" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'tr',
    "styleTags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "primary" TEXT,
    "secondary" TEXT,
    "palette" TEXT NOT NULL DEFAULT '[]',
    "headingFont" TEXT NOT NULL DEFAULT '{}',
    "bodyFont" TEXT NOT NULL DEFAULT '{}',
    "logoPath" TEXT,
    CONSTRAINT "brands_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "heroPath" TEXT,
    "galleryPaths" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "headline" TEXT,
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "cta" TEXT,
    "contact" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "contents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "layouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "sections" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "layouts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "themeJson" TEXT NOT NULL DEFAULT '{}',
    "patterns" TEXT NOT NULL DEFAULT '[]',
    "templateFront" TEXT NOT NULL DEFAULT '',
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'WP_THEME',
    "zipPath" TEXT NOT NULL,
    "sizeKB" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brands_projectId_key" ON "brands"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_projectId_key" ON "assets"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "contents_projectId_key" ON "contents"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "layouts_projectId_key" ON "layouts"("projectId");