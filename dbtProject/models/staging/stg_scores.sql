{{
    config(
        tags=['basic', 'staging']
    )
}}

WITH

scores AS (

    SELECT
        ID
        ,ASSESSMENT_ID
        ,NAME
        ,MAIL_ID
        ,SCORE
        
    FROM {{source('trainingdb','ASSESSMENT_SCORES')}}
)

SELECT * FROM scores
