## Если хочется позапускать это все.

В файле complete.sql есть скрипты, можно запускать их.

Если хочется запустить код, то нужно поставить nodejs

выполнить

```
npm install
```

А потом можно выполнять 

```
npm test
```

Только стоит указать данные для подключения 

```
  return MikroORM.init({
    entities: [Persons, MainBilling, BillingType, FinnalyB, FinnalyC],
    dbName: "billing",
    type: "postgresql",
    host: "127.0.0.1",
    port: 5432,
    password: "changeme",
    debug: false,
    // discovery: { disableDynamicFileAccess: true },
    // highlighter: new SqlHighlighter(),
  });
```

Внутри теста, для корректного коннекта к бд