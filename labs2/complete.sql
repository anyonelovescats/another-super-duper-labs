-- Для postgres

set statement_timeout = '999999 s';

-- A 79122469334
-- Д 79122491706

-- Проверяем что А не общался с D
SELECT count(*) FROM "main_billing" WHERE (phone_b=79122491706 AND abonentphone=79122469334) OR (phone_b=79122469334 AND abonentphone= 79122491706);


-- create table user_b
CREATE TABLE user_b AS 
SELECT DISTINCT phone_b FROM main_billing
WHERE 
  abonentphone = 79122469334
AND billing_type_id != 2 
AND billing_type_id != 3
AND phone_b != 79052233251
UNION
SELECT DISTINCT abonentphone FROM main_billing
WHERE 
  phone_b = 79122469334
AND abonentphone != 79052233251
AND billing_type_id != 2 
AND billing_type_id != 3;

-- Create user_c
CREATE TABLE user_c AS 
SELECT DISTINCT phone_b FROM main_billing
WHERE 
  abonentphone = 79122491706
AND phone_b != 79052233251
AND billing_type_id != 2 
AND billing_type_id != 3
UNION
SELECT DISTINCT abonentphone FROM main_billing
WHERE 
  phone_b = 79122491706
AND abonentphone != 79052233251
AND billing_type_id != 2
AND billing_type_id != 3;


-- Все взаимодействия Б и С
CREATE TABLE b_and_c AS
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE main_billing.abonentphone = user_b.phone_b AND main_billing.phone_b = user_c.phone_b
UNION
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE main_billing.abonentphone = user_c.phone_b AND main_billing.phone_b = user_b.phone_b;


-- Находим пересечение множеств b_and_c с множеством user_b отжимая только юзеров B
CREATE TABLE b AS 
  (SELECT DISTINCT abonentphone FROM b_and_c INTERSECT SELECT phone_b FROM user_b)
UNION 
  (SELECT DISTINCT phone_b FROM b_and_c INTERSECT SELECT phone_b FROM user_b);

-- Находим пересечение множеств b_and_c с множеством user_c отжимая только юзеров c
CREATE TABLE c AS 
  (SELECT DISTINCT abonentphone FROM b_and_c INTERSECT SELECT phone_b FROM user_c)
UNION 
  (SELECT DISTINCT phone_b FROM b_and_c INTERSECT SELECT phone_b FROM user_c);


-- Полный список количества и уникальных соединений
SELECT count(abonentphone),abonentphone,phone_b FROM "b_and_c" GROUP BY abonentphone,phone_b ORDER BY count DESC;


-- B -> C
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,b 
  WHERE 
  b_and_c.abonentphone = b.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b 
  ORDER BY count DESC;

-- C -> B
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,c
  WHERE 
  b_and_c.abonentphone = c.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b
  ORDER BY count DESC;

-- Для работы теста создадим временные таблицы с этой информацией
CREATE TABLE finnaly_b AS
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,b 
  WHERE 
  b_and_c.abonentphone = b.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b 
  ORDER BY count DESC;


CREATE TABLE finnaly_c AS 
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,c
  WHERE 
  b_and_c.abonentphone = c.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b
  ORDER BY count DESC;


-- Для работы тестов надо создать primary_key на таблицы с результатами
ALTER TABLE finnaly_b ADD COLUMN ID SERIAL PRIMARY KEY;
ALTER TABLE finnaly_c ADD COLUMN ID SERIAL PRIMARY KEY;


-- А вот красивая табличка с JOIN нами
SELECT count(abonentphone),abonentphone,concat(q.surname, ' ',q.name,' ',q.patronymic) as user_b,phone_b,concat(z.surname,' ',z.name,' ',z.patronymic) as user_c
  FROM b_and_c
  INNER JOIN persons AS q ON b_and_c.abonentphone = q.msisdn
  INNER JOIN persons AS z ON b_and_c.phone_b = z.msisdn
  GROUP BY abonentphone,q.surname,q.name,q.patronymic,phone_b,z.surname,z.name,z.patronymic
  ORDER BY count DESC;