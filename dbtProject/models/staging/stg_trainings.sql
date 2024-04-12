{{
    config(
        tags=['basic', 'staging']
    )
}}

WITH

training AS (

    SELECT
        ID          
        ,TRAINING_TOPIC
        ,TRAINING_DATE
        ,START_TIME
        ,END_TIME
        ,INTENDED_AUDIENCE
        ,MAIL_SENT

    FROM {{source('trainingdb','TRAINING_SCHEDULES')}}
)

SELECT * FROM training
