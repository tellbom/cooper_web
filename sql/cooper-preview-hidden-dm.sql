-- Cooper preview visibility upgrade only. No user/group/project grants are changed.
SET AUTOCOMMIT OFF;
WHENEVER SQLERROR EXIT ROLLBACK;
DECLARE
  n INT;
BEGIN
  SELECT COUNT(*) INTO n FROM "rbac_rule" WHERE "project"='cooper' AND "rule_code" IN ('portal/preview/news','portal/preview/notice','portal/preview/office');
  IF n <> 3 THEN
    RAISE_APPLICATION_ERROR(-20001,'Expected three cooper preview rules. Run cooper-production-dm.sql first.');
  END IF;
END;
/
INSERT INTO "rbac_outbox" ("event_id","event_type","project","payload","status","retry_count","created_at") SELECT LOWER(SYS_GUID()),'MenuChanged','cooper',JSON_OBJECT('project' VALUE 'cooper','ruleCode' VALUE r."rule_code",'ruleGuid' VALUE r."id",'changeKind' VALUE 'Updated','permissionCode' VALUE r."permission_code",'operatorUserid' VALUE 'cooper-menu-seed'),'Pending',0,CURRENT_TIMESTAMP FROM "rbac_rule" r WHERE "project"='cooper' AND "rule_code"='portal/preview/news' AND ("extend" IS NULL OR "extend"<>'add_rules_only' OR "menu_type" IS NULL OR "menu_type"<>'Link' OR "url" IS NULL OR "url"<>'/preview/news');
UPDATE "rbac_rule" SET "extend"='add_rules_only',"menu_type"='Link',"url"='/preview/news',"updated_at"=CURRENT_TIMESTAMP WHERE "project"='cooper' AND "rule_code"='portal/preview/news' AND ("extend" IS NULL OR "extend"<>'add_rules_only' OR "menu_type" IS NULL OR "menu_type"<>'Link' OR "url" IS NULL OR "url"<>'/preview/news');
INSERT INTO "rbac_outbox" ("event_id","event_type","project","payload","status","retry_count","created_at") SELECT LOWER(SYS_GUID()),'MenuChanged','cooper',JSON_OBJECT('project' VALUE 'cooper','ruleCode' VALUE r."rule_code",'ruleGuid' VALUE r."id",'changeKind' VALUE 'Updated','permissionCode' VALUE r."permission_code",'operatorUserid' VALUE 'cooper-menu-seed'),'Pending',0,CURRENT_TIMESTAMP FROM "rbac_rule" r WHERE "project"='cooper' AND "rule_code"='portal/preview/notice' AND ("extend" IS NULL OR "extend"<>'add_rules_only' OR "menu_type" IS NULL OR "menu_type"<>'Link' OR "url" IS NULL OR "url"<>'/preview/notice');
UPDATE "rbac_rule" SET "extend"='add_rules_only',"menu_type"='Link',"url"='/preview/notice',"updated_at"=CURRENT_TIMESTAMP WHERE "project"='cooper' AND "rule_code"='portal/preview/notice' AND ("extend" IS NULL OR "extend"<>'add_rules_only' OR "menu_type" IS NULL OR "menu_type"<>'Link' OR "url" IS NULL OR "url"<>'/preview/notice');
INSERT INTO "rbac_outbox" ("event_id","event_type","project","payload","status","retry_count","created_at") SELECT LOWER(SYS_GUID()),'MenuChanged','cooper',JSON_OBJECT('project' VALUE 'cooper','ruleCode' VALUE r."rule_code",'ruleGuid' VALUE r."id",'changeKind' VALUE 'Updated','permissionCode' VALUE r."permission_code",'operatorUserid' VALUE 'cooper-menu-seed'),'Pending',0,CURRENT_TIMESTAMP FROM "rbac_rule" r WHERE "project"='cooper' AND "rule_code"='portal/preview/office' AND ("extend" IS NULL OR "extend"<>'add_rules_only' OR "menu_type" IS NULL OR "menu_type"<>'Link' OR "url" IS NULL OR "url"<>'/preview/office');
UPDATE "rbac_rule" SET "extend"='add_rules_only',"menu_type"='Link',"url"='/preview/office',"updated_at"=CURRENT_TIMESTAMP WHERE "project"='cooper' AND "rule_code"='portal/preview/office' AND ("extend" IS NULL OR "extend"<>'add_rules_only' OR "menu_type" IS NULL OR "menu_type"<>'Link' OR "url" IS NULL OR "url"<>'/preview/office');
COMMIT;
SELECT "rule_code","extend","menu_type","url" FROM "rbac_rule" WHERE "project"='cooper' AND "rule_code" IN ('portal/preview/news','portal/preview/notice','portal/preview/office') ORDER BY "rule_code";
