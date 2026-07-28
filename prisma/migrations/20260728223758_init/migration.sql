-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipTier" TEXT NOT NULL DEFAULT 'FREE',
    "storageSubscriptionEnd" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "dataDeletionRequestedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "SessionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Untitled HACCP Plan',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "facilityProfile" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "retentionExpiresAt" TIMESTAMP(3),

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaccpTeamMember" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "expertise" TEXT,
    "responsibilities" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaccpTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "materialsSupplied" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "certification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "guaranteeOnFile" BOOLEAN NOT NULL DEFAULT false,
    "guaranteeExpiry" TEXT,
    "approvalDate" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productDescription" TEXT,
    "intendedUse" TEXT,
    "intendedConsumer" TEXT,
    "packagingType" TEXT,
    "shelfLifeAndStorage" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "flowConfirmedBy" TEXT,
    "flowConfirmedAt" TIMESTAMP(3),
    "flowConfirmationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentageOfFormulation" TEXT,
    "functionalRole" TEXT,
    "supplierVendorId" TEXT,
    "countryOfOrigin" TEXT,
    "isAllergen" BOOLEAN NOT NULL DEFAULT false,
    "allergenType" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessStep" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ProcessStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hazard" (
    "id" TEXT NOT NULL,
    "processStepId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isLikelyToOccur" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT NOT NULL DEFAULT 'MODERATE',
    "likelihood" TEXT NOT NULL DEFAULT 'POSSIBLE',
    "justification" TEXT,
    "requiresPreventiveControl" BOOLEAN NOT NULL DEFAULT false,
    "ccpQ1DoControlMeasuresExist" BOOLEAN,
    "ccpQ2IsStepSpecificallyToControl" BOOLEAN,
    "ccpQ3CouldContaminationExceedLimit" BOOLEAN,
    "ccpQ4WillLaterStepEliminate" BOOLEAN,
    "ccpStatus" TEXT NOT NULL DEFAULT 'NOT_EVALUATED',
    "criticalLimit" TEXT,
    "monitoringProcedure" TEXT,
    "monitoringFrequency" TEXT,
    "correctionAction" TEXT,
    "verificationProcedure" TEXT,
    "recordkeepingProcedure" TEXT,
    "responsibleParty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sop" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallContact" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecallContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockRecallRecord" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "performedBy" TEXT,
    "percentTraced" TEXT,
    "resultsSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockRecallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanExport" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Plan_userId_idx" ON "Plan"("userId");

-- CreateIndex
CREATE INDEX "HaccpTeamMember_planId_idx" ON "HaccpTeamMember"("planId");

-- CreateIndex
CREATE INDEX "Vendor_planId_idx" ON "Vendor"("planId");

-- CreateIndex
CREATE INDEX "Product_planId_idx" ON "Product"("planId");

-- CreateIndex
CREATE INDEX "Ingredient_productId_idx" ON "Ingredient"("productId");

-- CreateIndex
CREATE INDEX "Ingredient_supplierVendorId_idx" ON "Ingredient"("supplierVendorId");

-- CreateIndex
CREATE INDEX "ProcessStep_productId_idx" ON "ProcessStep"("productId");

-- CreateIndex
CREATE INDEX "Hazard_processStepId_idx" ON "Hazard"("processStepId");

-- CreateIndex
CREATE INDEX "Sop_planId_idx" ON "Sop"("planId");

-- CreateIndex
CREATE INDEX "RecallContact_planId_idx" ON "RecallContact"("planId");

-- CreateIndex
CREATE INDEX "MockRecallRecord_planId_idx" ON "MockRecallRecord"("planId");

-- CreateIndex
CREATE INDEX "PlanExport_planId_idx" ON "PlanExport"("planId");

-- AddForeignKey
ALTER TABLE "SessionToken" ADD CONSTRAINT "SessionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaccpTeamMember" ADD CONSTRAINT "HaccpTeamMember_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_supplierVendorId_fkey" FOREIGN KEY ("supplierVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessStep" ADD CONSTRAINT "ProcessStep_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hazard" ADD CONSTRAINT "Hazard_processStepId_fkey" FOREIGN KEY ("processStepId") REFERENCES "ProcessStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sop" ADD CONSTRAINT "Sop_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallContact" ADD CONSTRAINT "RecallContact_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockRecallRecord" ADD CONSTRAINT "MockRecallRecord_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanExport" ADD CONSTRAINT "PlanExport_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
