DO $$
BEGIN
  IF EXISTS (
    SELECT recommendation_id
    FROM reviews
    GROUP BY recommendation_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add reviews_recommendation_id_unique: duplicate recommendation_id values exist in reviews';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recommendation_id_unique" UNIQUE("recommendation_id");
