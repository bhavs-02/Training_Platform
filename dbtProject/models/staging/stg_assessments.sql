{{
    config(
        tags=['basic', 'staging']
    )
}}

WITH

assessments AS (

    SELECT
        ID
        ,ASSESSMENT_TOPIC
        ,ASSESSMENT_LINK
        ,INTENDED_AUDIENCE
        ,TOTAL_MARKS
        ,ASSESSMENT_DATE
        ,START_TIME
        ,END_TIME
        ,MAIL_SENT

    FROM {{source('trainingdb','ASSESSMENT_SCHEDULES')}}
)

SELECT * FROM assessments
