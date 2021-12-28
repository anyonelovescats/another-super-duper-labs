import { MikroORM } from "@mikro-orm/core";
import { SqlHighlighter } from "@mikro-orm/sql-highlighter";
import { BillingType } from "./entites/billingType";
import { MainBilling } from "./entites/mainBilling";
import { Persons } from "./entites/person";

const main = async () => {
  const orm = await MikroORM.init({
    entities: [Persons, MainBilling, BillingType],
    dbName: "billing2",
    type: "postgresql",
    host: "127.0.0.1",
    port: 5432,
    password: "changeme",
    // debug: false,
    // discovery: { disableDynamicFileAccess: true },
    // highlighter: new SqlHighlighter(),
  });

  const user_a = 79122469334;
  const user_d = 79122491706;

  const [user_b, count_b] = await orm.em.findAndCount(
    MainBilling,
    {
      $or: [{ abonentphone: user_a }, { phone_b: user_a }],
    },
    { limit: 1 }
  );

  const [user_c, count_c] = await orm.em.findAndCount(
    MainBilling,
    {
      $or: [{ abonentphone: user_d }, { phone_b: user_d }],
    },
    { limit: 1 }
  );
};

main();
