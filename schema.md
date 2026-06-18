# Content Asset Schema

The MVP uses a structured content asset model that can later move into Postgres with vector search and background ingestion workers.

## Required fields

- `id`
- `title`
- `url`
- `canonical_url`
- `source_type`
- `platform`
- `format`
- `language`
- `region`
- `published_date`
- `last_seen_date`
- `last_crawled_date`
- `raw_text`
- `summary`
- `primary_topic`
- `secondary_topics`
- `audience`
- `business_area`
- `funnel_stage`
- `key_claims`
- `proof_points`
- `suggested_use`
- `linkedin_copy_recommendations`
- `related_asset_ids`
- `ai_confidence_score`
- `metadata_status`
- `created_at`
- `updated_at`

## Optional performance fields

- `page_views`
- `search_clicks`
- `search_impressions`
- `social_engagements`
- `video_views`
- `source_performance_platform`

## Future services

- `source-registry`: stores approved public source locations, crawl cadence and source ownership.
- `crawler`: respects robots.txt, deduplicates by canonical URL and stores crawl timestamps.
- `ai-enrichment`: generates editable summaries, taxonomy tags, claims, proof points and campaign uses.
- `audit-engine`: scores freshness, duplication, metadata completeness, source accessibility and activation utility.
- `export-service`: emits CSV first, then planning decks and reports.
