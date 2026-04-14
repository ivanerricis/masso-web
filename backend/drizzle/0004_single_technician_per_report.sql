DELETE FROM "report_technician" a
USING (
    SELECT ctid, row_number() OVER (PARTITION BY "report_id" ORDER BY "technician_id") AS rn
    FROM "report_technician"
) b
WHERE a.ctid = b.ctid
  AND b.rn > 1;

ALTER TABLE "report_technician" DROP CONSTRAINT "report_technician_report_id_technician_id_pk";
ALTER TABLE "report_technician" ADD CONSTRAINT "report_technician_report_id_technician_id_pk" PRIMARY KEY ("report_id");
