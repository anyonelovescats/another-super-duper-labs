import { Entity, Property, PrimaryKey, Repository } from "@mikro-orm/core";

@Entity({ collection: "billing.finnaly_b" })
export class FinnalyB {
  @PrimaryKey()
  id!: number;

  @Property()
  count: number;

  @Property()
  abonentphone: number;

  @Property()
  phone_b: number;

  constructor(count: number, abonentphone: number, phone_b: number) {
    this.count = count;
    this.abonentphone = abonentphone;
    this.phone_b = phone_b;
  }
}
