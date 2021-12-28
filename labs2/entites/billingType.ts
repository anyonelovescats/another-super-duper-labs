import { Entity, Property, PrimaryKey, OneToOne } from "@mikro-orm/core";

@Entity({ collection: "billing.billing_type" })
export class BillingType {
  @PrimaryKey()
  id!: number;

  @Property()
  billing_type!: string;

  constructor(billing_type: string) {
    this.billing_type = billing_type;
  }
}
