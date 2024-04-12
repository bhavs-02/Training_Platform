WITH
    assessment_performance
    AS
    (
        SELECT
             ASSESSMENT_ID                                          AS ASSESSMENT_ID
            ,AVG(SCORE)                                             AS average_score
            ,AVG(CASE WHEN SCORE >= 50 THEN 1 ELSE 0 END) * 100     AS pass_percentage
            ,COUNT(NAME)                                   AS users_attempted

        FROM {{ ref('stg_scores') }}

    GROUP BY ASSESSMENT_ID
)

SELECT
    ap.ASSESSMENT_ID
    ,ap.average_score
    ,ap.pass_percentage
    ,ap.users_attempted

FROM assessment_performance ap
