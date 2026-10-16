DROP TRIGGER issue_development_link_rev ON issue_development_link;
--> statement-breakpoint
CREATE TRIGGER issue_development_link_rev AFTER INSERT OR UPDATE OR DELETE ON issue_development_link
  FOR EACH ROW EXECUTE FUNCTION rev_issue_child('issue_id', 'board');
--> statement-breakpoint
CREATE OR REPLACE FUNCTION rev_issue_development_check() RETURNS trigger AS $$
DECLARE
	link_id integer;
	target_id integer;
	p integer;
	i integer;
BEGIN
	IF TG_OP = 'DELETE' THEN link_id := OLD.development_link_id; ELSE link_id := NEW.development_link_id; END IF;
	SELECT l.issue_id, s.project_id, s.initiative_id INTO target_id, p, i
	FROM issue_development_link l JOIN issue s ON s.id = l.issue_id
	WHERE l.id = link_id;
	IF p IS NULL THEN RETURN NULL; END IF;
	PERFORM bump_rev('board:' || p, p);
	PERFORM bump_rev('issue:' || target_id, p);
	IF i IS NOT NULL THEN PERFORM bump_rev('initiative:' || i, p); END IF;
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
