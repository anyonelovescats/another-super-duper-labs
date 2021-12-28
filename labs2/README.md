Автор Владимир Лила

Моя фамилия на Л — 13 буква алфавита, делать мне первое задание. 

Буду детективом значится.

Подготовим полигон
------------------

Для начала нам понадобиться вытащить дамп базы из виртуалки, чтобы работать с ней как люди. 

Ставим vmware ладно хоть есть триал для студентов, и не придется пиратить.

Запускаем тачку, логинимся под root/12345

Дальше нужно чтоб мы видели тачку в нашей сети

![](https://teamdumpprod.blob.core.windows.net/images/medium/LOPZOR/image.png)

  

Воткнем бридж, но магии не случилось, ибо айпишник прибит гвоздем

отдираем

![](https://teamdumpprod.blob.core.windows.net/images/medium/v2j2ey/image.png)

  

Ребутаем и опа! Бридж!

![](https://teamdumpprod.blob.core.windows.net/images/medium/zxE8HI/image.png)

  

создаем бекап бд

![](https://teamdumpprod.blob.core.windows.net/images/medium/ANX8dp/image.png)

  

копируем его в /tmp чтоб не было проблем с вытаскиванием снаружи

![](https://teamdumpprod.blob.core.windows.net/images/medium/VMrjCJ/image.png)

  

Переносим себе через виндовый scp спасибо Сатья Наделла за ssh в windows10

Поднимем свой инстанс Mysql c подмонтированным бекапом

```
docker run --name mysql -p 3306:3306 -v /mnt/c/Users/WeslyG/billing.sql:/opt/billing.sql -e MYSQL_ROOT_PASSWORD=superDuperPassword -d mysql:5.6

```

И ресторим бекап 

![](https://teamdumpprod.blob.core.windows.net/images/medium/DekK9x/image.png)

  

Готово, коннектимся из vscode

ВАЖНО
-----

Я буду работать из vscode и запускать все скрипты в [экстеншене для работы с бд](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2)

Результат будет приведен в виде итогового SQL скрипта с комментариями в моем гитхабе, а также, на скринах, и в виде текста, для пущей достоверности. 

Иногда на скринах может отсутствовать точка с запятой на конце, и это не потому что скрины редактированные, а потому что так уж работает экстеншен, что когда ты запускаешь скрипт, он почему то выкидывает из него точку с запятой в конце. 

![](https://teamdumpprod.blob.core.windows.net/images/medium/R4ZDfy/image.png)

  

Например вот так. 

Поэтому это просто погрешность экстеншена. 

Еще один момент, **я перелил mysql в postgres,** т.к в задании не было четко сказано, на какой базе данных делать задачу, а мне ближе pg и я хочу получше изучить ее синтаксис, и посмотреть как она себя ведет на хороших запросах в реальных условиях. Поэтому на скринах слоник.

В целом для mysql запросы чутка будут отличаться, но сделать это там же не составит труда. 

Если что переливал бдшки с помощью pgloader на горячую из одной в другую. Как то вот так

```bash
pgloader 
    mysql://user:password@127.0.0.1/billing 
    postgresql://user:password@127.0.0.1:5432/billing

```

Ну и в качестве пруфов что все перелилось приведу скрины количества записей в табличках, и скрипты как настраивал бдшки для перелива. 

Скрипт настройки бд [https://gist.github.com/WeslyG/b37cd968d09ea2e361c257e5da8d2a75#file-mysql-to-postgres](https://gist.github.com/WeslyG/b37cd968d09ea2e361c257e5da8d2a75#file-mysql-to-postgres)

![](https://teamdumpprod.blob.core.windows.net/images/medium/pxv5NU/image.png)

  

Данные из mysql

![](https://teamdumpprod.blob.core.windows.net/images/medium/dg3k1r/image.png)

  

Данные из psql

Последний важный момент. Если делать лабу на mysql то от селектов в 3 таблицы скуль однопоточный ложиться на лопатки и не подымается ваще. 

Лечение — добавить индексов! 

```sql
CREATE INDEX id_index ON main_billing (id);
CREATE INDEX abonent_phone ON main_billing (abonentphone);
CREATE INDEX phone_b ON main_billing (phone_b);
CREATE INDEX common ON main_billing (abonentphone, phone_b);

SHOW INDEX FROM main_billing;

```

Посгрес даже без индексов справляется со всеми запросами на ура, но если будете эксперементировать, то на клиенте, pg держит лимит для запросов, который можно увеличить с помощью вот такого запроса SQL (прям туда где селекты вводить)

```sql
set statement_timeout = '999999 s';

```

Начинаем
--------

Проверим что коннекшен работает

![](https://teamdumpprod.blob.core.windows.net/images/medium/gjQDnX/image.png)

  

### Задание

Два абонента

А — 79122469334

Д — 79122491706

Нам нужно найти в цепочке Б и С

### Проверим время

Проверим, есть ли у нас записи за другой день, чем 06.06.2014

```sql
SELECT count(*) 
FROM main_billing 
WHERE 
billtime < '2014-06-06 00:00:00' 
OR
billtime > '2014-06-06 23:59:59';

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/1u5qUH/image.png)

  

Нет, у нас только записи за эти сутки, замечательно, минус фильтры. 

Общались ли А и Д напрямую
--------------------------

начнем с проверки что A -D абоненты, не общались друг с другом напрямую. 

```sql
SELECT count(*) FROM "main_billing" 
WHERE 
(phone_b=79122491706 AND abonentphone=79122469334)
 OR 
(phone_b=79122469334  AND abonentphone= 79122491706);

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/BOpnr9/image.png)

  

Звучит так, как будто бы действительно не общались. 

Найдем потенциальных Б
----------------------

Соберем список потенциальных абонентов Б, для этого просто возьмем всех с кем взаимодействовал абонент А.

Мы уберем из списка записей billing\_type = 2 и 3 (GPRS и LocUpd) соответственно, т.к ищем только взаимодействия людей. 

```sql
SELECT count(DISTINCT phone_b) FROM main_billing
WHERE abonentphone = 79122469334
AND billing_type_id != 2 
AND billing_type_id != 3;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/2MPA94/image.png)

  

Для начала оценим сколько уникальных номеров телефонов в этом списке. 

84 Штуки. Это потенциально все абоненты Б которые могут быть. 

Дальше нам они понадобятся, поэтому уберем каунт, и сохраним их в отдельную табличку. 

```sql
CREATE TABLE user_b AS 
SELECT DISTINCT abonentphone FROM main_billing 
WHERE phone_b = 79122469334 
AND billing_type_id != 2 AND billing_type_id != 3;

```

```sql
SELECT count(*) FROM user_b;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/zY1m2Z/image.png)

  

Посмотрим все ли нормально в табличке

```sql
SELECT * FROM user_b LIMIT 10;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/oISL6E/image.png)

  

Найдем потенциальных С
----------------------

Теперь все то же самое для С

```sql
SELECT count(DISTINCT phone_b) FROM main_billing
WHERE abonentphone = 79122491706
AND billing_type_id != 2 
AND billing_type_id != 3;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/rJTAvY/image.png)

  

```sql
CREATE TABLE user_c AS 
SELECT DISTINCT phone_b FROM main_billing
WHERE abonentphone = 79122491706
AND billing_type_id != 2 
AND billing_type_id != 3;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/BNFNT6/image.png)

  

Проверим сколько user\_c получилось

![](https://teamdumpprod.blob.core.windows.net/images/medium/ofncXG/image.png)

  

![](https://teamdumpprod.blob.core.windows.net/images/medium/uIy8qQ/image.png)

  

Все отлично, 158 уникальных номеров телефонов которые общались с абонентом D. 

Вот так на схеме выглядят наши таблицы user\_b и user\_c

![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSI1OTFweCIgaGVpZ2h0PSIyMDFweCIgdmlld0JveD0iLTAuNSAtMC41IDU5MSAyMDEiPjxkZWZzLz48Zz48cGF0aCBkPSJNIDgwIDEwMCBMIDExMy42MyAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiKDAsIDAsIDApIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50ZXItZXZlbnRzPSJzdHJva2UiLz48cGF0aCBkPSJNIDExOC44OCAxMDAgTCAxMTEuODggMTAzLjUgTCAxMTMuNjMgMTAwIEwgMTExLjg4IDk2LjUgWiIgZmlsbD0icmdiKDAsIDAsIDApIiBzdHJva2U9InJnYigwLCAwLCAwKSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PHJlY3QgeD0iMCIgeT0iNjUiIHdpZHRoPSI4MCIgaGVpZ2h0PSI3MCIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIiBzdHJva2U9InJnYigwLCAwLCAwKSIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiA3OHB4OyBoZWlnaHQ6IDFweDsgcGFkZGluZy10b3A6IDEwMHB4OyBtYXJnaW4tbGVmdDogMXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+PGZvbnQgc3R5bGU9ImZvbnQtc2l6ZTogMThweCI+QTwvZm9udD48L2Rpdj48L2Rpdj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PHRleHQgeD0iNDAiIHk9IjEwNCIgZmlsbD0icmdiKDAsIDAsIDApIiBmb250LWZhbWlseT0iSGVsdmV0aWNhIiBmb250LXNpemU9IjEycHgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkE8L3RleHQ+PC9zd2l0Y2g+PC9nPjxwYXRoIGQ9Ik0gNTEwIDEwMCBMIDQ2Ni4zNyAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiKDAsIDAsIDApIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50ZXItZXZlbnRzPSJzdHJva2UiLz48cGF0aCBkPSJNIDQ2MS4xMiAxMDAgTCA0NjguMTIgOTYuNSBMIDQ2Ni4zNyAxMDAgTCA0NjguMTIgMTAzLjUgWiIgZmlsbD0icmdiKDAsIDAsIDApIiBzdHJva2U9InJnYigwLCAwLCAwKSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PHJlY3QgeD0iNTEwIiB5PSI2NSIgd2lkdGg9IjgwIiBoZWlnaHQ9IjcwIiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiIHN0cm9rZT0icmdiKDAsIDAsIDApIiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuNSAtMC41KSI+PHN3aXRjaD48Zm9yZWlnbk9iamVjdCBwb2ludGVyLWV2ZW50cz0ibm9uZSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcmVxdWlyZWRGZWF0dXJlcz0iaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvZmVhdHVyZSNFeHRlbnNpYmlsaXR5IiBzdHlsZT0ib3ZlcmZsb3c6IHZpc2libGU7IHRleHQtYWxpZ246IGxlZnQ7Ij48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IHVuc2FmZSBjZW50ZXI7IGp1c3RpZnktY29udGVudDogdW5zYWZlIGNlbnRlcjsgd2lkdGg6IDc4cHg7IGhlaWdodDogMXB4OyBwYWRkaW5nLXRvcDogMTAwcHg7IG1hcmdpbi1sZWZ0OiA1MTFweDsiPjxkaXYgZGF0YS1kcmF3aW8tY29sb3JzPSJjb2xvcjogcmdiKDAsIDAsIDApOyAiIHN0eWxlPSJib3gtc2l6aW5nOiBib3JkZXItYm94OyBmb250LXNpemU6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IDEycHg7IGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2E7IGNvbG9yOiByZ2IoMCwgMCwgMCk7IGxpbmUtaGVpZ2h0OiAxLjI7IHBvaW50ZXItZXZlbnRzOiBhbGw7IHdoaXRlLXNwYWNlOiBub3JtYWw7IG92ZXJmbG93LXdyYXA6IG5vcm1hbDsiPjxmb250IHN0eWxlPSJmb250LXNpemU6IDE4cHgiPkQ8L2ZvbnQ+PC9kaXY+PC9kaXY+PC9kaXY+PC9mb3JlaWduT2JqZWN0Pjx0ZXh0IHg9IjU1MCIgeT0iMTA0IiBmaWxsPSJyZ2IoMCwgMCwgMCkiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMTJweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RDwvdGV4dD48L3N3aXRjaD48L2c+PGVsbGlwc2UgY3g9IjIwMCIgY3k9IjEwMCIgcng9IjgwIiByeT0iMTAwIiBmaWxsPSIjZGFlOGZjIiBzdHJva2U9IiM2YzhlYmYiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMC41IC0wLjUpIj48c3dpdGNoPjxmb3JlaWduT2JqZWN0IHBvaW50ZXItZXZlbnRzPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiByZXF1aXJlZEZlYXR1cmVzPSJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0V4dGVuc2liaWxpdHkiIHN0eWxlPSJvdmVyZmxvdzogdmlzaWJsZTsgdGV4dC1hbGlnbjogbGVmdDsiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIHN0eWxlPSJkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogdW5zYWZlIGNlbnRlcjsganVzdGlmeS1jb250ZW50OiB1bnNhZmUgY2VudGVyOyB3aWR0aDogMTU4cHg7IGhlaWdodDogMXB4OyBwYWRkaW5nLXRvcDogMTAwcHg7IG1hcmdpbi1sZWZ0OiAxMjFweDsiPjxkaXYgZGF0YS1kcmF3aW8tY29sb3JzPSJjb2xvcjogcmdiKDAsIDAsIDApOyAiIHN0eWxlPSJib3gtc2l6aW5nOiBib3JkZXItYm94OyBmb250LXNpemU6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IDE4cHg7IGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2E7IGNvbG9yOiByZ2IoMCwgMCwgMCk7IGxpbmUtaGVpZ2h0OiAxLjI7IHBvaW50ZXItZXZlbnRzOiBhbGw7IHdoaXRlLXNwYWNlOiBub3JtYWw7IG92ZXJmbG93LXdyYXA6IG5vcm1hbDsiPtCf0L7RgtC10L3RhtC40LDQu9GM0L3Ri9C1IEI8L2Rpdj48L2Rpdj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PHRleHQgeD0iMjAwIiB5PSIxMDUiIGZpbGw9InJnYigwLCAwLCAwKSIgZm9udC1mYW1pbHk9IkhlbHZldGljYSIgZm9udC1zaXplPSIxOHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7Qn9C+0YLQtdC90YbQuNCw0LvRjNC90YvQtSBCPC90ZXh0Pjwvc3dpdGNoPjwvZz48ZWxsaXBzZSBjeD0iMzgwIiBjeT0iMTAwIiByeD0iODAiIHJ5PSIxMDAiIGZpbGw9IiNkYWU4ZmMiIHN0cm9rZT0iIzZjOGViZiIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiAxNThweDsgaGVpZ2h0OiAxcHg7IHBhZGRpbmctdG9wOiAxMDBweDsgbWFyZ2luLWxlZnQ6IDMwMXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMThweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+0J/QvtGC0LXQvdGG0LjQsNC70YzQvdGL0LUgQzwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSIzODAiIHk9IjEwNSIgZmlsbD0icmdiKDAsIDAsIDApIiBmb250LWZhbWlseT0iSGVsdmV0aWNhIiBmb250LXNpemU9IjE4cHgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPtCf0L7RgtC10L3RhtC40LDQu9GM0L3Ri9C1IEM8L3RleHQ+PC9zd2l0Y2g+PC9nPjwvZz48c3dpdGNoPjxnIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIvPjxhIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTUpIiB4bGluazpocmVmPSJodHRwczovL3d3dy5kaWFncmFtcy5uZXQvZG9jL2ZhcS9zdmctZXhwb3J0LXRleHQtcHJvYmxlbXMiIHRhcmdldD0iX2JsYW5rIj48dGV4dCB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwcHgiIHg9IjUwJSIgeT0iMTAwJSI+Vmlld2VyIGRvZXMgbm90IHN1cHBvcnQgZnVsbCBTVkcgMS4xPC90ZXh0PjwvYT48L3N3aXRjaD48L3N2Zz4=)

Теперь нужно найти все общения Б с абонентами С.

Все взаимодействия Б и С
------------------------

Теперь нам нужно найти все взаимодействия потенциальных абонентов Б и С, для этого 

создадим таблицу b\_and\_c в которую соберем все записи из main\_billing в которых abonentphone (инициатор) из user\_b а получатель (phone\_b) из user\_c

И объединим это с запросом обратных взаимодействий, где инциатор из user\_c а получатель из user\_b. 

```sql
CREATE TABLE b_and_c AS 
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE main_billing.abonentphone = user_b.phone_b 
  AND main_billing.phone_b = user_c.phone_b
UNION
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE main_billing.abonentphone = user_c.phone_b 
  AND main_billing.phone_b = user_b.phone_b;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/y6oZH5/image.png)

  

Получилось довольно много записей, но это все взаимодействия всех предполагаемых B и С

Вот так на схеме выглядит наша таблица b\_and\_c (объединенная по Union)

![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSI1OTFweCIgaGVpZ2h0PSIxNTFweCIgdmlld0JveD0iLTAuNSAtMC41IDU5MSAxNTEiPjxkZWZzLz48Zz48ZWxsaXBzZSBjeD0iMjQwIiBjeT0iNzUiIHJ4PSI5MCIgcnk9Ijc1IiBmaWxsPSIjZGFlOGZjIiBzdHJva2U9IiM2YzhlYmYiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48cGF0aCBkPSJNIDQzNCA3NSBMIDQ5My42MyA3NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2IoMCwgMCwgMCkiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRlci1ldmVudHM9InN0cm9rZSIvPjxwYXRoIGQ9Ik0gNDk4Ljg4IDc1IEwgNDkxLjg4IDc4LjUgTCA0OTMuNjMgNzUgTCA0OTEuODggNzEuNSBaIiBmaWxsPSJyZ2IoMCwgMCwgMCkiIHN0cm9rZT0icmdiKDAsIDAsIDApIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48ZWxsaXBzZSBjeD0iMzQ0IiBjeT0iNzUiIHJ4PSI5MCIgcnk9Ijc1IiBmaWxsPSIjZGFlOGZjIiBzdHJva2U9IiM2YzhlYmYiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48cGF0aCBkPSJNIDkwIDc1IEwgMTQzLjYzIDc1IiBmaWxsPSJub25lIiBzdHJva2U9InJnYigwLCAwLCAwKSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBwb2ludGVyLWV2ZW50cz0ic3Ryb2tlIi8+PHBhdGggZD0iTSAxNDguODggNzUgTCAxNDEuODggNzguNSBMIDE0My42MyA3NSBMIDE0MS44OCA3MS41IFoiIGZpbGw9InJnYigwLCAwLCAwKSIgc3Ryb2tlPSJyZ2IoMCwgMCwgMCkiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxyZWN0IHg9IjAiIHk9IjQyLjUiIHdpZHRoPSI5MCIgaGVpZ2h0PSI2NSIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIiBzdHJva2U9InJnYigwLCAwLCAwKSIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiA4OHB4OyBoZWlnaHQ6IDFweDsgcGFkZGluZy10b3A6IDc1cHg7IG1hcmdpbi1sZWZ0OiAxcHg7Ij48ZGl2IGRhdGEtZHJhd2lvLWNvbG9ycz0iY29sb3I6IHJnYigwLCAwLCAwKTsgIiBzdHlsZT0iYm94LXNpemluZzogYm9yZGVyLWJveDsgZm9udC1zaXplOiAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgZm9udC1zaXplOiAxMnB4OyBmb250LWZhbWlseTogSGVsdmV0aWNhOyBjb2xvcjogcmdiKDAsIDAsIDApOyBsaW5lLWhlaWdodDogMS4yOyBwb2ludGVyLWV2ZW50czogYWxsOyB3aGl0ZS1zcGFjZTogbm9ybWFsOyBvdmVyZmxvdy13cmFwOiBub3JtYWw7Ij48Zm9udCBzdHlsZT0iZm9udC1zaXplOiAxOHB4Ij5BPC9mb250PjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSI0NSIgeT0iNzkiIGZpbGw9InJnYigwLCAwLCAwKSIgZm9udC1mYW1pbHk9IkhlbHZldGljYSIgZm9udC1zaXplPSIxMnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BPC90ZXh0Pjwvc3dpdGNoPjwvZz48cmVjdCB4PSI1MDAiIHk9IjQyLjUiIHdpZHRoPSI5MCIgaGVpZ2h0PSI2NSIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIiBzdHJva2U9InJnYigwLCAwLCAwKSIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiA4OHB4OyBoZWlnaHQ6IDFweDsgcGFkZGluZy10b3A6IDc1cHg7IG1hcmdpbi1sZWZ0OiA1MDFweDsiPjxkaXYgZGF0YS1kcmF3aW8tY29sb3JzPSJjb2xvcjogcmdiKDAsIDAsIDApOyAiIHN0eWxlPSJib3gtc2l6aW5nOiBib3JkZXItYm94OyBmb250LXNpemU6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IDEycHg7IGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2E7IGNvbG9yOiByZ2IoMCwgMCwgMCk7IGxpbmUtaGVpZ2h0OiAxLjI7IHBvaW50ZXItZXZlbnRzOiBhbGw7IHdoaXRlLXNwYWNlOiBub3JtYWw7IG92ZXJmbG93LXdyYXA6IG5vcm1hbDsiPjxmb250IHN0eWxlPSJmb250LXNpemU6IDE4cHgiPkQ8L2ZvbnQ+PC9kaXY+PC9kaXY+PC9kaXY+PC9mb3JlaWduT2JqZWN0Pjx0ZXh0IHg9IjU0NSIgeT0iNzkiIGZpbGw9InJnYigwLCAwLCAwKSIgZm9udC1mYW1pbHk9IkhlbHZldGljYSIgZm9udC1zaXplPSIxMnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5EPC90ZXh0Pjwvc3dpdGNoPjwvZz48cmVjdCB4PSIxODAiIHk9IjYwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjMwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMC41IC0wLjUpIj48c3dpdGNoPjxmb3JlaWduT2JqZWN0IHBvaW50ZXItZXZlbnRzPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiByZXF1aXJlZEZlYXR1cmVzPSJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0V4dGVuc2liaWxpdHkiIHN0eWxlPSJvdmVyZmxvdzogdmlzaWJsZTsgdGV4dC1hbGlnbjogbGVmdDsiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIHN0eWxlPSJkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogdW5zYWZlIGNlbnRlcjsganVzdGlmeS1jb250ZW50OiB1bnNhZmUgY2VudGVyOyB3aWR0aDogMjE4cHg7IGhlaWdodDogMXB4OyBwYWRkaW5nLXRvcDogNzVweDsgbWFyZ2luLWxlZnQ6IDE4MXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+PGZvbnQgc3R5bGU9ImZvbnQtc2l6ZTogMTZweCI+0JLRgdC1INCy0LfQsNC40LzQvtC00LXQudGB0YLQstC40LUgQiDQuCBDPC9mb250PjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSIyOTAiIHk9Ijc5IiBmaWxsPSJyZ2IoMCwgMCwgMCkiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMTJweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+0JLRgdC1INCy0LfQsNC40LzQvtC00LXQudGB0YLQstC40LUgQiDQuCBDPC90ZXh0Pjwvc3dpdGNoPjwvZz48L2c+PHN3aXRjaD48ZyByZXF1aXJlZEZlYXR1cmVzPSJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0V4dGVuc2liaWxpdHkiLz48YSB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC01KSIgeGxpbms6aHJlZj0iaHR0cHM6Ly93d3cuZGlhZ3JhbXMubmV0L2RvYy9mYXEvc3ZnLWV4cG9ydC10ZXh0LXByb2JsZW1zIiB0YXJnZXQ9Il9ibGFuayI+PHRleHQgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMHB4IiB4PSI1MCUiIHk9IjEwMCUiPlZpZXdlciBkb2VzIG5vdCBzdXBwb3J0IGZ1bGwgU1ZHIDEuMTwvdGV4dD48L2E+PC9zd2l0Y2g+PC9zdmc+)

Теперь нужно понять, кто из всех предполагаемых user\_b и user\_c является реальными юзерами Б и С. 

Вычислим B и C
--------------

Для этого, из взаимодействия b\_and\_c отфильтруем только те уникальные номера, которые имеют отношения к user\_b. 

В mysql нет intersect оператора, поэтому надо использовать «эмулятор» в виде WHERE phone\_b IN (SELECT phone\_b FROM user\_b)

```sql
CREATE TABLE b AS 
  (SELECT DISTINCT abonentphone FROM b_and_c INTERSECT SELECT phone_b FROM user_b)
UNION 
  (SELECT DISTINCT phone_b FROM b_and_c INTERSECT SELECT phone_b FROM user_b);

```

![](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSI1MzFweCIgaGVpZ2h0PSIyMDVweCIgdmlld0JveD0iLTAuNSAtMC41IDUzMSAyMDUiPjxkZWZzLz48Zz48ZWxsaXBzZSBjeD0iMjEyIiBjeT0iNzUiIHJ4PSI5MCIgcnk9Ijc1IiBmaWxsPSIjZGFlOGZjIiBzdHJva2U9IiM2YzhlYmYiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48ZWxsaXBzZSBjeD0iMzE2IiBjeT0iNzUiIHJ4PSI5MCIgcnk9Ijc1IiBmaWxsPSIjZGFlOGZjIiBzdHJva2U9IiM2YzhlYmYiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48cmVjdCB4PSIxNTIiIHk9IjYwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjMwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiIHBvaW50ZXItZXZlbnRzPSJhbGwiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMC41IC0wLjUpIj48c3dpdGNoPjxmb3JlaWduT2JqZWN0IHBvaW50ZXItZXZlbnRzPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiByZXF1aXJlZEZlYXR1cmVzPSJodHRwOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9mZWF0dXJlI0V4dGVuc2liaWxpdHkiIHN0eWxlPSJvdmVyZmxvdzogdmlzaWJsZTsgdGV4dC1hbGlnbjogbGVmdDsiPjxkaXYgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiIHN0eWxlPSJkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogdW5zYWZlIGNlbnRlcjsganVzdGlmeS1jb250ZW50OiB1bnNhZmUgY2VudGVyOyB3aWR0aDogMjE4cHg7IGhlaWdodDogMXB4OyBwYWRkaW5nLXRvcDogNzVweDsgbWFyZ2luLWxlZnQ6IDE1M3B4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+PGZvbnQgc3R5bGU9ImZvbnQtc2l6ZTogMTZweCI+0JLRgdC1INCy0LfQsNC40LzQvtC00LXQudGB0YLQstC40LUgQiDQuCBDPC9mb250PjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSIyNjIiIHk9Ijc5IiBmaWxsPSJyZ2IoMCwgMCwgMCkiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMTJweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+0JLRgdC1INCy0LfQsNC40LzQvtC00LXQudGB0YLQstC40LUgQiDQuCBDPC90ZXh0Pjwvc3dpdGNoPjwvZz48ZWxsaXBzZSBjeD0iODAiIGN5PSI3NSIgcng9IjYwIiByeT0iNDAiIGZpbGw9IiNkYWU4ZmMiIHN0cm9rZT0iIzZjOGViZiIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiAxMThweDsgaGVpZ2h0OiAxcHg7IHBhZGRpbmctdG9wOiA3NXB4OyBtYXJnaW4tbGVmdDogMjFweDsiPjxkaXYgZGF0YS1kcmF3aW8tY29sb3JzPSJjb2xvcjogcmdiKDAsIDAsIDApOyAiIHN0eWxlPSJib3gtc2l6aW5nOiBib3JkZXItYm94OyBmb250LXNpemU6IDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyBmb250LXNpemU6IDEycHg7IGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2E7IGNvbG9yOiByZ2IoMCwgMCwgMCk7IGxpbmUtaGVpZ2h0OiAxLjI7IHBvaW50ZXItZXZlbnRzOiBhbGw7IHdoaXRlLXNwYWNlOiBub3JtYWw7IG92ZXJmbG93LXdyYXA6IG5vcm1hbDsiPlVzZXJfYjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSI4MCIgeT0iNzkiIGZpbGw9InJnYigwLCAwLCAwKSIgZm9udC1mYW1pbHk9IkhlbHZldGljYSIgZm9udC1zaXplPSIxMnB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Vc2VyX2I8L3RleHQ+PC9zd2l0Y2g+PC9nPjxlbGxpcHNlIGN4PSI0NTAiIGN5PSI3NSIgcng9IjYwIiByeT0iNDAiIGZpbGw9IiNkYWU4ZmMiIHN0cm9rZT0iIzZjOGViZiIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiAxMThweDsgaGVpZ2h0OiAxcHg7IHBhZGRpbmctdG9wOiA3NXB4OyBtYXJnaW4tbGVmdDogMzkxcHg7Ij48ZGl2IGRhdGEtZHJhd2lvLWNvbG9ycz0iY29sb3I6IHJnYigwLCAwLCAwKTsgIiBzdHlsZT0iYm94LXNpemluZzogYm9yZGVyLWJveDsgZm9udC1zaXplOiAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgZm9udC1zaXplOiAxMnB4OyBmb250LWZhbWlseTogSGVsdmV0aWNhOyBjb2xvcjogcmdiKDAsIDAsIDApOyBsaW5lLWhlaWdodDogMS4yOyBwb2ludGVyLWV2ZW50czogYWxsOyB3aGl0ZS1zcGFjZTogbm9ybWFsOyBvdmVyZmxvdy13cmFwOiBub3JtYWw7Ij5Vc2VyX2M8L2Rpdj48L2Rpdj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PHRleHQgeD0iNDUwIiB5PSI3OSIgZmlsbD0icmdiKDAsIDAsIDApIiBmb250LWZhbWlseT0iSGVsdmV0aWNhIiBmb250LXNpemU9IjEycHgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlVzZXJfYzwvdGV4dD48L3N3aXRjaD48L2c+PGVsbGlwc2UgY3g9IjEzMCIgY3k9Ijc1IiByeD0iMTAiIHJ5PSIyNSIgZmlsbD0iI2ZmZjJjYyIgc3Ryb2tlPSIjZDZiNjU2IiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuNSAtMC41KSI+PHN3aXRjaD48Zm9yZWlnbk9iamVjdCBwb2ludGVyLWV2ZW50cz0ibm9uZSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcmVxdWlyZWRGZWF0dXJlcz0iaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvZmVhdHVyZSNFeHRlbnNpYmlsaXR5IiBzdHlsZT0ib3ZlcmZsb3c6IHZpc2libGU7IHRleHQtYWxpZ246IGxlZnQ7Ij48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IHVuc2FmZSBjZW50ZXI7IGp1c3RpZnktY29udGVudDogdW5zYWZlIGNlbnRlcjsgd2lkdGg6IDE4cHg7IGhlaWdodDogMXB4OyBwYWRkaW5nLXRvcDogNzVweDsgbWFyZ2luLWxlZnQ6IDEyMXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+QjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSIxMzAiIHk9Ijc5IiBmaWxsPSJyZ2IoMCwgMCwgMCkiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMTJweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QjwvdGV4dD48L3N3aXRjaD48L2c+PGVsbGlwc2UgY3g9IjQwMCIgY3k9Ijc1IiByeD0iMTAiIHJ5PSIyNSIgZmlsbD0iI2ZmZjJjYyIgc3Ryb2tlPSIjZDZiNjU2IiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuNSAtMC41KSI+PHN3aXRjaD48Zm9yZWlnbk9iamVjdCBwb2ludGVyLWV2ZW50cz0ibm9uZSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcmVxdWlyZWRGZWF0dXJlcz0iaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvZmVhdHVyZSNFeHRlbnNpYmlsaXR5IiBzdHlsZT0ib3ZlcmZsb3c6IHZpc2libGU7IHRleHQtYWxpZ246IGxlZnQ7Ij48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IHVuc2FmZSBjZW50ZXI7IGp1c3RpZnktY29udGVudDogdW5zYWZlIGNlbnRlcjsgd2lkdGg6IDE4cHg7IGhlaWdodDogMXB4OyBwYWRkaW5nLXRvcDogNzVweDsgbWFyZ2luLWxlZnQ6IDM5MXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+QzwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSI0MDAiIHk9Ijc5IiBmaWxsPSJyZ2IoMCwgMCwgMCkiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EiIGZvbnQtc2l6ZT0iMTJweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QzwvdGV4dD48L3N3aXRjaD48L2c+PHBhdGggZD0iTSAxMTAgMTcwIEwgMTEwIDE1MCBMIDEyOS4yIDE1MCBMIDEyOS4yIDEwOC4wNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2IoMCwgMCwgMCkiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRlci1ldmVudHM9InN0cm9rZSIvPjxwYXRoIGQ9Ik0gMTI5LjIgMTAyLjgyIEwgMTMyLjcgMTA5LjgyIEwgMTI5LjIgMTA4LjA3IEwgMTI1LjcgMTA5LjgyIFoiIGZpbGw9InJnYigwLCAwLCAwKSIgc3Ryb2tlPSJyZ2IoMCwgMCwgMCkiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxyZWN0IHg9IjAiIHk9IjE3MCIgd2lkdGg9IjIyMCIgaGVpZ2h0PSIzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTAuNSAtMC41KSI+PHN3aXRjaD48Zm9yZWlnbk9iamVjdCBwb2ludGVyLWV2ZW50cz0ibm9uZSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcmVxdWlyZWRGZWF0dXJlcz0iaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvZmVhdHVyZSNFeHRlbnNpYmlsaXR5IiBzdHlsZT0ib3ZlcmZsb3c6IHZpc2libGU7IHRleHQtYWxpZ246IGxlZnQ7Ij48ZGl2IHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiBzdHlsZT0iZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IHVuc2FmZSBjZW50ZXI7IGp1c3RpZnktY29udGVudDogdW5zYWZlIGNlbnRlcjsgd2lkdGg6IDIxOHB4OyBoZWlnaHQ6IDFweDsgcGFkZGluZy10b3A6IDE4NXB4OyBtYXJnaW4tbGVmdDogMXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+PHNwYW4gc3R5bGU9ImZvbnQtc2l6ZTogMTZweCI+SU5URVJTRUNUIHNlbGVjdMKgPGJyIC8+0KLQvtGH0L3QviBCPGJyIC8+PC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSIxMTAiIHk9IjE4OSIgZmlsbD0icmdiKDAsIDAsIDApIiBmb250LWZhbWlseT0iSGVsdmV0aWNhIiBmb250LXNpemU9IjEycHgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPklOVEVSU0VDVCBzZWxlY3QuLi48L3RleHQ+PC9zd2l0Y2g+PC9nPjxwYXRoIGQ9Ik0gNDIwIDE3MCBMIDQyMCAxMzUgTCA0MDAgMTM1IEwgNDAwIDEwNi4zNyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2IoMCwgMCwgMCkiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRlci1ldmVudHM9InN0cm9rZSIvPjxwYXRoIGQ9Ik0gNDAwIDEwMS4xMiBMIDQwMy41IDEwOC4xMiBMIDQwMCAxMDYuMzcgTCAzOTYuNSAxMDguMTIgWiIgZmlsbD0icmdiKDAsIDAsIDApIiBzdHJva2U9InJnYigwLCAwLCAwKSIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBwb2ludGVyLWV2ZW50cz0iYWxsIi8+PHJlY3QgeD0iMzEwIiB5PSIxNzAiIHdpZHRoPSIyMjAiIGhlaWdodD0iMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0ibm9uZSIgcG9pbnRlci1ldmVudHM9ImFsbCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0wLjUgLTAuNSkiPjxzd2l0Y2g+PGZvcmVpZ25PYmplY3QgcG9pbnRlci1ldmVudHM9Im5vbmUiIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIgc3R5bGU9Im92ZXJmbG93OiB2aXNpYmxlOyB0ZXh0LWFsaWduOiBsZWZ0OyI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiB1bnNhZmUgY2VudGVyOyBqdXN0aWZ5LWNvbnRlbnQ6IHVuc2FmZSBjZW50ZXI7IHdpZHRoOiAyMThweDsgaGVpZ2h0OiAxcHg7IHBhZGRpbmctdG9wOiAxODVweDsgbWFyZ2luLWxlZnQ6IDMxMXB4OyI+PGRpdiBkYXRhLWRyYXdpby1jb2xvcnM9ImNvbG9yOiByZ2IoMCwgMCwgMCk7ICIgc3R5bGU9ImJveC1zaXppbmc6IGJvcmRlci1ib3g7IGZvbnQtc2l6ZTogMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IGZvbnQtc2l6ZTogMTJweDsgZm9udC1mYW1pbHk6IEhlbHZldGljYTsgY29sb3I6IHJnYigwLCAwLCAwKTsgbGluZS1oZWlnaHQ6IDEuMjsgcG9pbnRlci1ldmVudHM6IGFsbDsgd2hpdGUtc3BhY2U6IG5vcm1hbDsgb3ZlcmZsb3ctd3JhcDogbm9ybWFsOyI+PHNwYW4gc3R5bGU9ImZvbnQtc2l6ZTogMTZweCI+SU5URVJTRUNUIHNlbGVjdMKgPGJyIC8+0KLQvtGH0L3QviBDPGJyIC8+PC9zcGFuPjwvZGl2PjwvZGl2PjwvZGl2PjwvZm9yZWlnbk9iamVjdD48dGV4dCB4PSI0MjAiIHk9IjE4OSIgZmlsbD0icmdiKDAsIDAsIDApIiBmb250LWZhbWlseT0iSGVsdmV0aWNhIiBmb250LXNpemU9IjEycHgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPklOVEVSU0VDVCBzZWxlY3QuLi48L3RleHQ+PC9zd2l0Y2g+PC9nPjwvZz48c3dpdGNoPjxnIHJlcXVpcmVkRmVhdHVyZXM9Imh0dHA6Ly93d3cudzMub3JnL1RSL1NWRzExL2ZlYXR1cmUjRXh0ZW5zaWJpbGl0eSIvPjxhIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsLTUpIiB4bGluazpocmVmPSJodHRwczovL3d3dy5kaWFncmFtcy5uZXQvZG9jL2ZhcS9zdmctZXhwb3J0LXRleHQtcHJvYmxlbXMiIHRhcmdldD0iX2JsYW5rIj48dGV4dCB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwcHgiIHg9IjUwJSIgeT0iMTAwJSI+Vmlld2VyIGRvZXMgbm90IHN1cHBvcnQgZnVsbCBTVkcgMS4xPC90ZXh0PjwvYT48L3N3aXRjaD48L3N2Zz4=)

Для юзера C код будет аналогичный.

```sql
CREATE TABLE c AS
  (SELECT DISTINCT abonentphone FROM b_and_c INTERSECT SELECT phone_b FROM user_c)
UNION 
  (SELECT DISTINCT phone_b FROM b_and_c INTERSECT SELECT phone_b FROM user_c);

```

Посмотрим количество записей в этих таблицах. 

![](https://teamdumpprod.blob.core.windows.net/images/medium/hwIDSQ/image.png)

  

Для B — 105 номеров

![](https://teamdumpprod.blob.core.windows.net/images/medium/zaNzYP/image.png)

  

Для С — 197 уникальных номеров. 

Проверим пересечение Б и С
--------------------------

А проверим ка, что среди Б и С внезапно нет одинаковых номеров телефонов. Это нужно для того, чтобы исключить общение кого то из Б или С напрямую с А или Д. 

Код прост

```sql
SELECT abonentphone FROM b INTERSECT SELECT abonentphone FROM c;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/XXyCHq/image.png)

  

Опа! Нашелся номер, который есть и в b и в c! 

Поглядим, а взаимодействовал ли он правда с А или D. 

Проверяем C -> D

```sql
SELECT * FROM "main_billing" WHERE 
(phone_b=79052233251 AND abonentphone=79122491706) 
OR
(phone_b=79122491706 AND abonentphone=79052233251);

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/C3ysgm/image.png)

  

Да, действительно взаимодействовал. А теперь в обратную сторону?

Проверяем С -> A

```sql
SELECT * FROM "main_billing" WHERE
(phone_b=79052233251 AND abonentphone=79122469334)
OR
(phone_b=79122469334  AND abonentphone=79052233251);

```

И снова да. 

![](https://teamdumpprod.blob.core.windows.net/images/medium/M1TEm0/image.png)

  

Исследуем общение B и С 
------------------------

Посмотрим, кто из b\_and\_c чаще всего инициировал коммуникации. 

```sql
SELECT count(*),abonentphone FROM "b_and_c" GROUP BY abonentphone ORDER BY count DESC;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/ZbBZE2/image.png)

  

Увидим очень любопытную картину, всего 15 инициаторов (из 105 и 197) б и с соответственно.

При этом львиную долю всех коммуникаций затеял тот самый наш абонент `79052233251` который одновременно входит и в B и в С.

### Дилемма

Я долго размышлял над тем, что исключение данного индивидуума, дело плохое, т.к это рушит данные, и весьма вероятно, что этот абонент мог быть полезен. 

Например предположим что `79052233251` это юзер Б. В таком случае, он мог бы обратиться к существующим юзерам C и они уже дошли бы до Д. Даже не смотря на то, что сам он напрямую взаимодействовал и с А и с Д.

Давайте напишем такой запрос. 

![](https://teamdumpprod.blob.core.windows.net/images/medium/THbPRS/image.png)

  

Теперь же проверим, что он мог быть юзером С, и общаться с юзерами б. 

![](https://teamdumpprod.blob.core.windows.net/images/medium/C1LL2O/image.png)

  

Да, это тоже было. Поэтому я не хотел удалять этого юзера из базы. Однако он мне все поломал.

Я просто начал смотреть, в каких случаях, он являлся получателем сигнала из наших b\_and\_c таблиц (т.е где он phone\_b)

![](https://teamdumpprod.blob.core.windows.net/images/medium/UgYHt7/image.png)

  

И тут я сломался полностью, т.к единственный кто звонил ему, это …. он сам! 

И нет, я не ошибся, именно звонил! 

Я даже пошел и сделал прямой запрос.

![](https://teamdumpprod.blob.core.windows.net/images/medium/vESjZn/image.png)

  

Тут либо мне нужно было так делать запрос на B и С чтобы его не включать изначально. 

Либо это намеренное запутывание. 

Либо это битые (неконсистентные) данные. 

В любом случае, биллинг звонящий сам себе по 44 минуты это уже перебор. 

Я принял решение пренебречь данным абонентом, т.к его биллинг явно свидетельствует о сбое в системе учета, или вообще о ее взломе. 

Исключаем лишнего
-----------------

Теперь все тоже самое, но без `79052233251`

Создаем user\_b и user\_c

```sql
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

```

```sql
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

```

Сразу проверяем их пересечения

```sql
SELECT * FROM user_b INTERSECT SELECT * FROM user_c;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/7pHcQE/image.png)

  

Теперь они не пересекаются.

Найдем среди них b\_and\_c все взаимодействия. 

```sql
CREATE TABLE b_and_c AS
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE 
  main_billing.abonentphone = user_b.phone_b 
  AND 
  main_billing.phone_b = user_c.phone_b
UNION
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE 
  main_billing.abonentphone = user_c.phone_b 
  AND 
  main_billing.phone_b = user_b.phone_b;

```

Теперь их пересечение это всего то 76 взаимодействий. Можно и руками изучить. 

![](https://teamdumpprod.blob.core.windows.net/images/medium/AxKCgg/image.png)

  

Но мы все же отфильтруем только тех, кто явно Б и явно С. 

Посмотрим сколько оригинальных user\_b = 104

```sql
CREATE TABLE b AS 
  (SELECT DISTINCT abonentphone FROM b_and_c INTERSECT SELECT phone_b FROM user_b)
UNION 
  (SELECT DISTINCT phone_b FROM b_and_c INTERSECT SELECT phone_b FROM user_b);

```

Отсеим только тех, кто явно взаимодействовал с A, и это всего 13 человек (было 104)

![](https://teamdumpprod.blob.core.windows.net/images/medium/lIMAzO/image.png)

  

![](https://teamdumpprod.blob.core.windows.net/images/medium/qcfJiE/image.png)

  

Теперь то же самое для С

```sql
CREATE TABLE c AS 
  (SELECT DISTINCT abonentphone FROM b_and_c INTERSECT SELECT phone_b FROM user_c)
UNION 
  (SELECT DISTINCT phone_b FROM b_and_c INTERSECT SELECT phone_b FROM user_c);

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/cesPQg/image.png)

  

![](https://teamdumpprod.blob.core.windows.net/images/medium/r0JOSM/image.png)

  

Стало 15 из 197, это замечательно!

Построим взаимодействие Б и С снова
-----------------------------------

```sql
CREATE TABLE b_and_c AS
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE main_billing.abonentphone = user_b.phone_b AND main_billing.phone_b = user_c.phone_b
UNION
SELECT main_billing.* FROM main_billing,user_b,user_c
  WHERE main_billing.abonentphone = user_c.phone_b AND main_billing.phone_b = user_b.phone_b;

```

Теперь у нас всего 76 взаимодействий всех б и с. (в обе стороны)

![](https://teamdumpprod.blob.core.windows.net/images/medium/wnC3NK/image.png)

  

Посмотрим статистику по этим взаимодействиям

```sql
SELECT count(abonentphone),abonentphone,phone_b FROM "b_and_c"
GROUP BY abonentphone,phone_b ORDER BY count DESC;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/ouoV5A/image.png)

  

Итого, у нас 16 пар, это взаимодействие в **обе стороны!**

Можем разбить его на 

### B->C

```sql
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,b 
  WHERE 
  b_and_c.abonentphone = b.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b 
  ORDER BY count DESC

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/hh0EDA/image.png)

ровно 70 взаимодействий

### C -> B

![](https://teamdumpprod.blob.core.windows.net/images/medium/3xs8BZ/image.png)

еще 6 взаимодействий

Математика сходится. У нас получается ровно 76 взаимодействий в сумме, и можем их разбить на составляющие.

А еще можно посмотреть, кто же кому звонил. 

Да будут джойны!

```sql
SELECT 
count(abonentphone),
abonentphone,
concat(q.surname, ' ',q.name,' ',q.patronymic) as user_b,phone_b,
concat(z.surname,' ',z.name,' ',z.patronymic) as user_c
  FROM b_and_c
  INNER JOIN persons AS q ON b_and_c.abonentphone = q.msisdn
  INNER JOIN persons AS z ON b_and_c.phone_b = z.msisdn
  GROUP BY 
      abonentphone,
      q.surname,
      q.name,
      q.patronymic,
      phone_b,
      z.surname,
      z.name,
      z.patronymic
  ORDER BY count DESC

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/gDOApB/image.png)

  

Видно, что самые популярные это жены взаимодействуют с мужьями (судя по персонажам) 

Но не будем расслабляться! Нам нужно найти доказательства в этой цепочке. 

Под подозрением все!

Сохраним B-C и C-B в отдельные таблички, чтобы было проще с ними работать в будущем.

```sql
CREATE TABLE finnaly_b AS 
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,b 
  WHERE 
  b_and_c.abonentphone = b.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b 
  ORDER BY count DESC;

```

```sql
CREATE TABLE finnaly_c AS 
SELECT count(b_and_c.abonentphone),b_and_c.abonentphone,b_and_c.phone_b 
  FROM b_and_c,c
  WHERE 
  b_and_c.abonentphone = c.abonentphone
  GROUP BY b_and_c.abonentphone,b_and_c.phone_b
  ORDER BY count DESC;

```

Ищем посредников
----------------

План такой.   
У нас есть уникальные взаимодействия промежуточных звен, нам нужно построить из нее A->B->C->D так, чтобы время логично шло от начала взаимодействия к концу. Или же построить обратную цепочку D->C->B->A так, чтобы время тоже шло от утра к вечеру, в обоих случаях. 

Я вижу эту задачу алгоритмической, и не особо представляю, как это можно красиво сделать НЕ руками. (я ленив) 

А потому расчехлим код, и напишем тест. 

### Алгоритм будет такой:

*   Берем Б ищем его взаимодействия с А, в сторону А->Б
*   Берем С ищем его взаимодействие с Д в сторону C ->Д
*   Далее если мы нашли обе пары выстраиваем время их взаимодействия последовательно.
*   Если время сходится (т.е A-Б потом Б-С, потом С-Д) то значит эта цепочка валидна. 

Вторую цепочку будем запускать отдельно, так как взаимодействий C->Б очень мало (6 штук всего)

и делать все то же в обратном порядке. 

*   Берем связь С -> Б
*   у С находим связь Д->C
*   у Б находим связь Б -> А
*   Выстраиваем по времени, проверяем сходимость

Я буду использовать nodejs + micro-orm потому что это мой основной стек.

Но код в целом должен быть понятен.

Перед тем как я начал писать код, ORM Заставила меня добавить PrimaryKey на таблицу. 

```sql
ALTER TABLE finnaly_b ADD COLUMN ID SERIAL PRIMARY KEY;
ALTER TABLE finnaly_c ADD COLUMN ID SERIAL PRIMARY KEY;

```

Код
---

Код завязан на orm и довольно обширный, поэтому его можно посмотреть в моем репе. 

Я приведу лишь важные детали. 

Нам нужно получать даты всех взаимодействий указанных людей, создадим универсальный получатель этих вещей. Он будет возвращать массив дат, или null если взаимодействий не было.

```typescript
 const universal_get_time = async (
    from: number,
    to: number,
    orm: any
  ): Promise<null | Date[]> => {
    const res = await orm.em.findAndCount(MainBilling, {
      abonentphone: from,
      phone_b: to,
    });
    const count = res[1];
    if (count === 0) {
      return null;
    } else {
      const result = [];
      for (let i = 0; i < count; i++) {
        result.push(new Date(res[0][i].billtime));
      }
      return result;
    }
  };

```

А теперь напишем тест, это полный код теста. 

```typescript
  it("A -> B -> C -> D", async () => {
    const orm = await getOrm();
    const [b_and_c, count] = await orm.em.findAndCount(FinnalyB, {});
    const promise1 = [];
    const promise2 = [];
    const promise3 = [];
    expect(count).toBe(10);

    for (let i of b_and_c) {
      // A -> B
      promise1.push(universal_get_time(user_a, i.abonentphone, orm));

      // B -> C
      promise2.push(universal_get_time(i.abonentphone, i.phone_b, orm));

      // C -> D
      promise3.push(universal_get_time(i.phone_b, user_d, orm));
    }
    const a_to_b = await Promise.all(promise1);
    const b_to_c = await Promise.all(promise2);
    const c_to_a = await Promise.all(promise3);

    for (let i = 0; i < b_and_c.length; i++) {
      if (a_to_b[i] !== null && b_to_c[i] !== null && c_to_a[i] !== null) {
        const result = b_to_c[i]?.some(
          (x) =>
            a_to_b[i]?.some((x2) => x2 < x) && c_to_a[i]?.some((x3) => x3 > x)
        );
        if (result === true) {
          console.log(
            `SUCCESS: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
          );
        } else {
          console.log(
            `FAILED:  нет совпадения времени: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
          );
        }
      } else {
        console.log(
          `FAILED: Нет полных связей: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
        );
      }
    }
  });

```

Тут есть 2 фазы, мы собираем данные, и мы их обрабатываем. 

```typescript
    for (let i of b_and_c) {
      // A -> B
      promise1.push(universal_get_time(user_a, i.abonentphone, orm));

      // B -> C
      promise2.push(universal_get_time(i.abonentphone, i.phone_b, orm));

      // C -> D
      promise3.push(universal_get_time(i.phone_b, user_d, orm));
    }
    const a_to_b = await Promise.all(promise1);
    const b_to_c = await Promise.all(promise2);
    const c_to_a = await Promise.all(promise3);

```

Вот тут мы инициализируем запросы из базы, по нужным связям, массивы promiseN нужны лишь для асинхронной обработки событий получения объектов из бд, поэтому итоговые данные названы по человечески. (a\_to\_b, b\_to\_c,c\_to\_a) это массивы дат, между этими клиентами. 

А теперь самое сложное. 

Каждое взаимодействие например А и Б может быть множественным, а потому и даты возвращаются всегда в массиве. 

```typescript
for (let i = 0; i < b_and_c.length; i++) {
      if (a_to_b[i] !== null && b_to_c[i] !== null && c_to_a[i] !== null) {
        const result = b_to_c[i]?.some(
          (x) =>
            a_to_b[i]?.some((x2) => x2 < x) && c_to_a[i]?.some((x3) => x3 > x)
        );
        if (result === true) {
          console.log(
            `SUCCESS: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
          );
        } else {
          console.log(
            `FAILED:  нет совпадения времени: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
          );
        }
      } else {
        console.log(
          `FAILED: Нет полных связей: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
        );
      }
    }

```

В этом коде мы идем по всем полученным из таблицы finnaly\_b данным, и с каждой стороны запрашиваем взаимодействие вида A\_to\_B дальше B\_to\_C и в конце C\_to\_D

В 2 строке мы обрабатываем Null если хоть одной связи в цепочке нет, то нам не интересно условие. скажем об этом в лог.

самое сложное для чтения и понимания это 5 строка. 

Тут мы идем по центральному взаимодействию B\_TO\_C (обратите внимания начинается конструкция на 3 строке. 

И ищем, хоть одно совпадение, когда слева будет время меньше, а справа больше. 

Т.е когда наш B\_to\_C стоит по центру. 

Т.е до него были взаимодействия, потом он, и потом еще были. Таким образом мы можем доказать, что цепочка шла по очереди от А до Д

Посмотрим вывод в консоли

```
yarn test

```

```
FAILED нет совпадения времени: (A = 79122469334) -> (B = 79922285854) -> (C = 79122285861) -> (D = 79122491706)  console.log
FAILED нет совпадения времени: (A = 79122469334) -> (B = 79052233556) -> (C = 79122233551) -> (D = 79122491706)
FAILED нет совпадения времени: (A = 79122469334) -> (B = 79032310314) -> (C = 79122310307) -> (D = 79122491706)
Нет полных связей: (A = 79122469334) -> (B = 79032273019) -> (C = 79052242851) -> (D = 79122491706)
Нет полных связей: (A = 79122469334) -> (B = 79322305670) -> (C = 79222345739) -> (D = 79122491706)
SUCCESS: (A = 79122469334) -> (B = 79322305670) -> (C = 79122319606) -> (D = 79122491706)
FAILED нет совпадения времени: (A = 79122469334) -> (B = 79922285854) -> (C = 79122274691) -> (D = 79122491706)
SUCCESS: (A = 79122469334) -> (B = 79052399068) -> (C = 79922478074) -> (D = 79122491706)
FAILED нет совпадения времени: (A = 79122469334) -> (B = 79222338456) -> (C = 79122379482) -> (D = 79122491706)
Нет полных связей: (A = 79122469334) -> (B = 79222271667) -> (C = 79222376195) -> (D = 79122491706)

```

Оставим только успешные. 

### Ура мы нашли первые цепочки

```
(A = 79122469334) -> (B = 79322305670) -> (C = 79122319606) -> (D = 79122491706)
(A = 79122469334) -> (B = 79052399068) -> (C = 79922478074) -> (D = 79122491706)

```

Итак мы нашли две точно доказанных цепочки взаимодействия в сторону А -Д.

Теперь поищем в обратную сторону

### Есть ли еще

Напишем второй тест, который отобразит все то же самое в обратном порядке (важно не накосячить) — помним, время идет также, не смотря на то, что цепочка идет в обратную сторону. 

```typescript
it("D -> C -> B -> A", async () => {
    const orm = await getOrm();
    const [c_and_b, count] = await orm.em.findAndCount(FinnalyC, {});
    const promise1 = [];
    const promise2 = [];
    const promise3 = [];
    expect(count).toBe(6);

    for (let i of c_and_b) {
      // D -> C
      promise1.push(universal_get_time(user_d, i.abonentphone, orm));

      // C -> B
      promise2.push(universal_get_time(i.abonentphone, i.phone_b, orm));

      // B -> A
      promise3.push(universal_get_time(i.phone_b, user_a, orm));
    }
    const d_to_c = await Promise.all(promise1);
    const c_to_b = await Promise.all(promise2);
    const b_to_a = await Promise.all(promise3);

    for (let i = 0; i < c_and_b.length; i++) {
      if (d_to_c[i] !== null && c_to_b[i] !== null && b_to_a[i] !== null) {
        const result = c_to_b[i]?.some(
          (x) =>
            d_to_c[i]?.some((x2) => x2 < x) && b_to_a[i]?.some((x3) => x3 > x)
        );
        if (result === true) {
          console.log(
            `SUCCESS: (D = ${user_d}) -> (C = ${c_and_b[i].abonentphone}) -> (B = ${c_and_b[i].phone_b}) -> (A = ${user_a})`
          );
        } else {
          console.log(
            `FAILED:  нет совпадения времени: (D = ${user_a}) -> (C = ${c_and_b[i].abonentphone}) -> (B = ${c_and_b[i].phone_b}) -> (A = ${user_d})`
          );
        }
      } else {
        console.log(
          `FAILED: Нет полных связей: (D = ${user_d}) -> (C = ${c_and_b[i].abonentphone}) -> (B = ${c_and_b[i].phone_b}) -> (A = ${user_a})`
        );
      }
    }
  });

```

Комментировать я не буду, это тот же самый код.

Поглядим на результат выполнения команды 

```
yarn test

```

И теперь

```
FAILED:  нет совпадения времени: (D = 79122469334) -> (C = 79052265213) -> (B = 79122235643) -> (A = 79122491706)
FAILED: Нет полных связей: (D = 79122491706) -> (C = 79032409144) -> (B = 79222327265) -> (A = 79122469334)
FAILED: Нет полных связей: (D = 79122491706) -> (C = 79052273853) -> (B = 79222350399) -> (A = 79122469334)
FAILED:  нет совпадения времени: (D = 79122469334) -> (C = 79822315810) -> (B = 79222469344) -> (A = 79122491706)
FAILED: Нет полных связей: (D = 79122491706) -> (C = 79922478074) -> (B = 79052399068) -> (A = 79122469334)
FAILED:  нет совпадения времени: (D = 79122469334) -> (C = 79222247108) -> (B = 79122300906) -> (A = 79122491706)

```

Неа, больше связок нет. У нас несовпадения по времени, или и того хуже отсутсвие полных связей. 

Итоги
-----

Итого, мы нашли 2х возможных подозреваемых. 

Это или цепочка

```
Б - 79322305670 - Зайцев Роман Владимироич
С - 79122319606 - Хохлов Виктор Василий

```

Или 

```
Б - 79052399068 - Матвеева Лидия Артуровна
С - 79922478074 - Ларин Георгий Романович

```

Дальше можно делать многое, изучать детальнее, где находились эти абоненты, к каким базовым станциям подключались, типы и виды коммуникаций, написать запрос, отображающий все их переговоры, и тд. Но в рамках этой работы я думаю достаточно. 

### Бонус

Я все же решил написать запрос, на отображение всех их взаимодействий. 

Цепочка 1

```sql
SELECT * FROM "main_billing" 
WHERE 
(abonentphone = 79122469334 AND phone_b = 79322305670) 
OR
(abonentphone = 79322305670 AND phone_b = 79122319606)
OR
(abonentphone = 79122319606 AND phone_b = 79122491706)
ORDER BY billtime;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/w4Zgkk/image.png)

  

Цепочка 2

```sql
SELECT * FROM "main_billing" 
WHERE 
(abonentphone = 79122469334 AND phone_b = 79052399068) 
OR
(abonentphone = 79052399068 AND phone_b = 79922478074)
OR
(abonentphone = 79922478074 AND phone_b = 79122491706)
ORDER BY billtime;

```

![](https://teamdumpprod.blob.core.windows.net/images/medium/SD8o15/image.png)

  

Их цепочки действительно сходятся по времени. 

На этом все! Дело раскрыто.