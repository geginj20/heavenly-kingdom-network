CREATE OR REPLACE FUNCTION increment_prayer_count(p_id bigint)
RETURNS SETOF prayers AS $$
BEGIN
  RETURN QUERY UPDATE prayers SET prayers = prayers + 1 WHERE id = p_id RETURNING *;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_prayer_comment_count(p_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE prayers SET comments = comments + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
