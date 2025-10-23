-- CreateIndex
CREATE INDEX "driver_metrics_driverId_date_idx" ON "driver_metrics"("driverId", "date");

-- CreateIndex
CREATE INDEX "driver_metrics_calculatedScore_idx" ON "driver_metrics"("calculatedScore");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "drivers"("status");

-- CreateIndex
CREATE INDEX "drivers_joinedAt_idx" ON "drivers"("joinedAt");

-- CreateIndex
CREATE INDEX "drivers_language_idx" ON "drivers"("language");
