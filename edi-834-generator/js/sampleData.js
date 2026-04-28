/**
 * Sample seed data for randomization. All values are synthetic / non-PII.
 */
window.SAMPLE_DATA = {
  firstNamesM: ["JOHN", "MICHAEL", "DAVID", "ROBERT", "JAMES", "WILLIAM", "RICHARD", "THOMAS", "CHARLES", "DANIEL"],
  firstNamesF: ["MARY", "PATRICIA", "JENNIFER", "LINDA", "ELIZABETH", "BARBARA", "SUSAN", "JESSICA", "SARAH", "KAREN"],
  lastNames: ["SMITH", "JOHNSON", "WILLIAMS", "BROWN", "JONES", "GARCIA", "MILLER", "DAVIS", "RODRIGUEZ", "MARTINEZ"],
  middleInitials: ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T"],
  streets: [
    "100 OAK STREET",
    "245 MAPLE AVENUE",
    "78 ELM ROAD",
    "1234 PINE LANE",
    "501 CEDAR DRIVE",
    "67 BIRCH WAY",
    "890 WALNUT STREET",
    "23 SPRUCE COURT"
  ],
  cities: [
    {city: "AUSTIN", state: "TX", zip: "78701"},
    {city: "DENVER", state: "CO", zip: "80202"},
    {city: "SEATTLE", state: "WA", zip: "98101"},
    {city: "BOSTON", state: "MA", zip: "02108"},
    {city: "ATLANTA", state: "GA", zip: "30303"},
    {city: "CHICAGO", state: "IL", zip: "60601"},
    {city: "PHOENIX", state: "AZ", zip: "85001"},
    {city: "PORTLAND", state: "OR", zip: "97201"}
  ],
  sponsorNames: [
    "ACME EMPLOYER GROUP",
    "GLOBAL TECH CORP",
    "MIDWEST MANUFACTURING INC",
    "SUNRISE FINANCIAL LLC",
    "BLUE OAK CONSULTING",
    "PACIFIC LOGISTICS COMPANY"
  ],
  payerNames: [
    "UNITED HEALTH PLAN",
    "BLUE CROSS BLUE SHIELD",
    "AETNA HEALTH INC",
    "CIGNA HEALTHCARE",
    "HUMANA INSURANCE CO",
    "KAISER PERMANENTE"
  ],
  planDescriptions: [
    "GOLD PPO PLAN",
    "SILVER HMO PLAN",
    "BRONZE EPO PLAN",
    "PLATINUM PPO HIGH",
    "HDHP WITH HSA",
    "PREMIER FAMILY PLAN"
  ],

  /** Generate a random integer in [min, max] inclusive. */
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /** Pick a random element from an array. */
  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /** Generate a 9-digit numeric string. */
  numericId(len = 9) {
    let s = "";
    for (let i = 0; i < len; i++) s += this.randInt(0, 9);
    return s;
  },

  /** Build a randomized member record. */
  randomMember() {
    const gender = this.pick(["M", "F"]);
    const firstName = this.pick(gender === "M" ? this.firstNamesM : this.firstNamesF);
    const lastName = this.pick(this.lastNames);
    const addr = this.pick(this.cities);
    const dobYear = this.randInt(1955, 2000);
    const dobMonth = String(this.randInt(1, 12)).padStart(2, "0");
    const dobDay = String(this.randInt(1, 28)).padStart(2, "0");
    return {
      subscriberId: this.numericId(9),
      ssn: this.numericId(9),
      firstName,
      lastName,
      middleName: this.pick(this.middleInitials),
      dateOfBirth: `${dobYear}-${dobMonth}-${dobDay}`,
      gender,
      maritalStatus: this.pick(["I", "M", "D", "W"]),
      addressLine1: this.pick(this.streets),
      addressLine2: "",
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      phone: this.numericId(10),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`
    };
  },

  /** Build a randomized dependent (child by default). */
  randomDependent(relationship = "19") {
    const isChild = relationship === "19";
    const gender = this.pick(["M", "F"]);
    const firstName = this.pick(gender === "M" ? this.firstNamesM : this.firstNamesF);
    const lastName = this.pick(this.lastNames);
    const dobYear = isChild ? this.randInt(2008, 2024) : this.randInt(1955, 2000);
    return {
      depFirstName: firstName,
      depLastName: lastName,
      depDateOfBirth: `${dobYear}-${String(this.randInt(1,12)).padStart(2,"0")}-${String(this.randInt(1,28)).padStart(2,"0")}`,
      depGender: gender,
      depSsn: this.numericId(9),
      dependentRelationship: relationship
    };
  },

  /** Randomize sponsor / payer / coverage info. */
  randomSponsor() {
    return {
      sponsorName: this.pick(this.sponsorNames),
      sponsorTaxId: this.numericId(9),
      payerName: this.pick(this.payerNames),
      payerId: this.numericId(9),
      planDescription: this.pick(this.planDescriptions),
      groupNumber: "GRP" + this.numericId(8)
    };
  }
};
