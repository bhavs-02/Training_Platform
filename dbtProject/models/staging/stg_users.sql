{{
    config(
        tags=['basic', 'staging']
    )
}}

WITH

users AS (

    SELECT

        ID      
        ,USERNAME
        ,NAME
        ,MAIL_ID
        ,PHONE_NUMBER
        ,USER_TYPE
        ,CREATOR_ID
        ,PASSWORD

    FROM {{source('trainingdb','USER_DATA')}}

)

SELECT * FROM users