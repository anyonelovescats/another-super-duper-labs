import { Entity, Property, PrimaryKey, Repository } from "@mikro-orm/core";

@Entity({ collection: "billing.persons" })
// @Repository("billing.persons")
export class Persons {
  @PrimaryKey()
  id!: number;

  @Property()
  soc_st: number;

  @Property()
  surname: string;

  @Property()
  name: string;

  @Property()
  patronymic: string;

  @Property()
  move_template: number;

  @Property()
  mobile_operator: number;

  @Property()
  lac_id: number;

  @Property()
  cell_id: number;

  @Property()
  imsi: number;

  @Property()
  imei: number;

  @Property()
  msisdn: number;

  constructor(
    billing_type: number,
    surname: string,
    name: string,
    patronymic: string,
    move_template: number,
    mobile_operator: number,
    lac_id: number,
    cell_id: number,
    imsi: number,
    imei: number,
    msisdn: number
  ) {
    this.soc_st = billing_type;
    this.surname = surname;
    this.name = name;
    this.patronymic = patronymic;
    this.move_template = move_template;
    this.mobile_operator = mobile_operator;
    this.lac_id = lac_id;
    this.cell_id = cell_id;
    this.imsi = imsi;
    this.imei = imei;
    this.msisdn = msisdn;
  }
}
