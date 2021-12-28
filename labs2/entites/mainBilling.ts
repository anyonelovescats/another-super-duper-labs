import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  OneToOne,
} from "@mikro-orm/core";
import { BillingType } from "./billingType";

@Entity({ collection: "billing.main_billing" })
export class MainBilling {
  @PrimaryKey()
  id!: number;

  @Property()
  billtime: Date;

  @Property()
  call_duration: number;

  @ManyToOne()
  billing_type_id: BillingType;

  @Property()
  lac_id: number;

  @Property()
  cell_id: number;

  @Property()
  phone_b: number;

  @Property()
  abonent_id: number;

  @Property()
  abonentimei: number;

  @Property()
  abonentmsi: number;

  @Property()
  abonentphone: number;

  @Property()
  reverseabonentphone: number;

  @Property()
  reversephoneb: number;

  constructor(
    billtime: Date,
    call_duration: number,
    billing_type_id: BillingType,
    lac_id: number,
    cell_id: number,
    phone_b: number,
    abonent_id: number,
    abonentimei: number,
    abonentmsi: number,
    abonentphone: number,
    reverseabonentphone: number,
    reversephoneb: number
  ) {
    this.billtime = billtime;
    this.call_duration = call_duration;
    this.billing_type_id = billing_type_id;
    this.lac_id = lac_id;
    this.cell_id = cell_id;
    this.phone_b = phone_b;
    this.abonent_id = abonent_id;
    this.abonentimei = abonentimei;
    this.abonentmsi = abonentmsi;
    this.abonentphone = abonentphone;
    this.reverseabonentphone = reverseabonentphone;
    this.reversephoneb = reversephoneb;
  }
}
