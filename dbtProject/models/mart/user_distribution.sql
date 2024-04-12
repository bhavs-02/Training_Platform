SELECT
    USER_TYPE,
    COUNT(*) AS user_count
FROM {{ ref('stg_users') }}
GROUP BY USER_TYPE
