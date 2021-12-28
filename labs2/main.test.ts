import { MikroORM } from "@mikro-orm/core";
import { BillingType } from "./entites/billingType";
import { FinnalyB } from "./entites/FinnalyB";
import { FinnalyC } from "./entites/FinnalyC";
import { MainBilling } from "./entites/mainBilling";
import { Persons } from "./entites/person";

const user_a = 79122469334;
const user_d = 79122491706;

const getOrm = async () => {
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
};

describe("Proof db test", () => {
  //   it("Find count all possible user_b", async () => {
  //     const orm = await getOrm();
  //     const [user_b, count_b] = await orm.em.findAndCount(
  //       MainBilling,
  //       {
  //         $or: [{ abonentphone: user_a }, { phone_b: user_a }],
  //       },
  //       { limit: 1 }
  //     );
  //     console.log(user_b[0].billing_type_id);
  //     expect(count_b).toBe(750);
  //   });

  // it("Find count all possible user_c", async () => {
  //   const orm = await getOrm();
  //   const [user_c, count_c] = await orm.em.findAndCount(
  //     MainBilling,
  //     {
  //       $or: [{ abonentphone: user_d }, { phone_b: user_d }],
  //     },
  //     { limit: 1, populate: ["billing_type_id"] }
  //   );
  //   user_c[0].billing_type_id.billing_type; //?
  //   expect(count_c).toBe(810);
  // });

  // it("Are there any direct connections from A -> D or D -> A to be 0", async () => {
  //   const orm = await getOrm();
  //   const [res, count] = await orm.em.findAndCount(
  //     MainBilling,
  //     {
  //       $or: [
  //         { $and: [{ abonentphone: user_a }, { phone_b: user_d }] },
  //         { $and: [{ abonentphone: user_d }, { phone_b: user_a }] },
  //       ],
  //     },
  //     { limit: 1 }
  //   );
  //   expect(count).toBe(0);
  //   expect(res.length).toBe(0);
  // });

  // it("try distinct", async () => {
  //   const orm = await getOrm();
  //   const em = orm.em as EntityManager;
  //   const res = await em
  //     .createQueryBuilder(MainBilling)
  //     .select("*", true)
  //     .where({
  //       abonentphone: 79122469334,
  //     })
  //     .getResult();
  //   // await em.populate(res, ["billing_type_id"]);
  //   // .execute("run"); //? $.rows.length
  //   res; //?
  // });

  // it("A -> B -> C -> D", async () => {
  //   const orm = await getOrm();
  //   const [b_and_c, count] = await orm.em.findAndCount(FinnalyB, {});
  //   const promise1 = [];
  //   const promise2 = [];
  //   const promise3 = [];
  //   expect(count).toBe(10);

  //   for (let i of b_and_c) {
  //     // A -> B
  //     promise1.push(universal_get_time(user_a, i.abonentphone, orm));

  //     // B -> C
  //     promise2.push(universal_get_time(i.abonentphone, i.phone_b, orm));

  //     // C -> D
  //     promise3.push(universal_get_time(i.phone_b, user_d, orm));
  //   }
  //   const a_to_b = await Promise.all(promise1);
  //   const b_to_c = await Promise.all(promise2);
  //   const c_to_a = await Promise.all(promise3);

  //   for (let i = 0; i < b_and_c.length; i++) {
  //     if (a_to_b[i] !== null && b_to_c[i] !== null && c_to_a[i] !== null) {
  //       const result = b_to_c[i]?.some(
  //         (x) =>
  //           a_to_b[i]?.some((x2) => x2 < x) && c_to_a[i]?.some((x3) => x3 > x)
  //       );
  //       if (result === true) {
  //         console.log(
  //           `SUCCESS: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
  //         );
  //       } else {
  //         console.log(
  //           `FAILED:  нет совпадения времени: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
  //         );
  //       }
  //     } else {
  //       console.log(
  //         `FAILED: Нет полных связей: (A = ${user_a}) -> (B = ${b_and_c[i].abonentphone}) -> (C = ${b_and_c[i].phone_b}) -> (D = ${user_d})`
  //       );
  //     }
  //   }
  // });

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
});
