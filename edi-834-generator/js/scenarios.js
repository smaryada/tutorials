/**
 * 834 Enrollment scenario definitions.
 *
 * Each scenario defines:
 *   - id, name, group, description
 *   - bgn08:        Action code (Original "00", Change "2", Verify "4", Replace "RX", etc.)
 *   - ins01:        Member indicator ("Y" = subscriber, "N" = dependent)
 *   - ins02:        Relationship code (18 self, 01 spouse, 19 child, etc.)
 *   - ins03:        Maintenance Type ("021" add, "001" change, "024" term, "025" reinstate, "030" audit)
 *   - ins04:        Maintenance Reason ("28" initial, "32" marriage, "02" birth, "03" death, ...)
 *   - ins05:        Benefit Status ("A" active, "C" COBRA, "S" surviving)
 *   - ins08:        Employment Status (AC, AO, FT, PT, RT, TE, ...)
 *   - includesDependent: true if scenario adds a dependent INS loop
 *   - includesSubscriber: false if scenario only contains a dependent change (default true)
 *   - dateQualifiers:  Array of {qualifier, dateField} for the 2000-loop DTP segments
 *   - notes:        Implementation notes shown in the UI
 *   - defaults:     Field overrides applied when the scenario is selected
 */
window.SCENARIOS = [
  // ----- ENROLLMENT GROUP -----
  {
    id: "new-subscriber",
    group: "Enrollment",
    name: "New Subscriber Enrollment",
    description: "Initial enrollment of a new employee/subscriber with health coverage.",
    bgn08: "00",
    ins01: "Y", ins02: "18", ins03: "021", ins04: "28", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"},
      {qualifier: "336", source: "effectiveDate"}
    ],
    notes: "INS03=021 (Add), INS04=28 (Initial Enrollment), INS05=A (Active)."
  },
  {
    id: "new-subscriber-with-family",
    group: "Enrollment",
    name: "New Enrollment with Family",
    description: "Subscriber enrolled together with spouse and one child for family coverage.",
    bgn08: "00",
    ins01: "Y", ins02: "18", ins03: "021", ins04: "28", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    extraDependents: [
      {relationship: "01", role: "spouse"},
      {relationship: "19", role: "child"}
    ],
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"},
      {qualifier: "336", source: "effectiveDate"}
    ],
    defaults: { coverageLevel: "FAM" },
    notes: "Three INS loops: subscriber + spouse + child. Coverage level=FAM."
  },
  {
    id: "open-enrollment",
    group: "Enrollment",
    name: "Open Enrollment Election",
    description: "Annual open enrollment selection by an existing employee.",
    bgn08: "00",
    ins01: "Y", ins02: "18", ins03: "021", ins04: "EC", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "INS04=EC (Member Benefit Selection) — typical for open-enrollment events."
  },
  {
    id: "rehire",
    group: "Enrollment",
    name: "Rehire Re-enrollment",
    description: "Employee returning after termination — re-enrolled into benefits.",
    bgn08: "00",
    ins01: "Y", ins02: "18", ins03: "021", ins04: "41", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"},
      {qualifier: "336", source: "effectiveDate"}
    ],
    notes: "INS04=41 (Re-enrollment)."
  },

  // ----- DEPENDENT GROUP -----
  {
    id: "add-spouse",
    group: "Dependents",
    name: "Add Spouse (Marriage)",
    description: "Add a spouse to an existing subscriber's coverage due to marriage.",
    bgn08: "2",
    ins01: "N", ins02: "01", ins03: "021", ins04: "32", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    includesDependent: true,
    defaults: { dependentRelationship: "01", coverageLevel: "ESP" },
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "INS04=32 (Marriage). Dependent INS loop with relationship=01 (Spouse)."
  },
  {
    id: "add-newborn",
    group: "Dependents",
    name: "Add Newborn (Birth)",
    description: "Add a newborn child following a qualifying birth event.",
    bgn08: "2",
    ins01: "N", ins02: "19", ins03: "021", ins04: "02", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    includesDependent: true,
    defaults: { dependentRelationship: "19", coverageLevel: "ECH" },
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "INS04=02 (Birth). Effective date typically equals the date of birth."
  },
  {
    id: "add-adoption",
    group: "Dependents",
    name: "Add Adopted Child",
    description: "Add a newly adopted child to family coverage.",
    bgn08: "2",
    ins01: "N", ins02: "19", ins03: "021", ins04: "05", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    includesDependent: true,
    defaults: { dependentRelationship: "19", coverageLevel: "ECH" },
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "INS04=05 (Adoption)."
  },
  {
    id: "remove-spouse-divorce",
    group: "Dependents",
    name: "Remove Spouse (Divorce)",
    description: "Terminate a spouse's coverage due to divorce.",
    bgn08: "2",
    ins01: "N", ins02: "01", ins03: "024", ins04: "01", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    includesDependent: true,
    defaults: { dependentRelationship: "01" },
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"}
    ],
    notes: "INS03=024 (Term), INS04=01 (Divorce). DTP*357 is eligibility-end date."
  },
  {
    id: "remove-child-age-out",
    group: "Dependents",
    name: "Child Age-Out Termination",
    description: "Dependent child reaches max coverage age and is terminated.",
    bgn08: "2",
    ins01: "N", ins02: "19", ins03: "024", ins04: "07", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    includesDependent: true,
    defaults: { dependentRelationship: "19" },
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"}
    ],
    notes: "INS04=07 (Termination of Benefits) for age limit reached."
  },

  // ----- TERMINATION GROUP -----
  {
    id: "voluntary-term",
    group: "Terminations",
    name: "Voluntary Termination",
    description: "Subscriber voluntarily terminates coverage.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "024", ins04: "14", ins05: "A", ins08: "TE",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"},
      {qualifier: "337", source: "effectiveDate"}
    ],
    notes: "INS04=14 (Voluntary Withdrawal). Employment status=TE (Terminated)."
  },
  {
    id: "involuntary-term",
    group: "Terminations",
    name: "Termination of Employment",
    description: "Coverage terminated due to end of employment.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "024", ins04: "08", ins05: "A", ins08: "TE",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"},
      {qualifier: "337", source: "effectiveDate"}
    ],
    notes: "INS04=08 (Termination of Employment)."
  },
  {
    id: "death-term",
    group: "Terminations",
    name: "Termination — Death",
    description: "Subscriber coverage termination due to death.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "024", ins04: "03", ins05: "A", ins08: "TE",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"}
    ],
    notes: "INS04=03 (Death)."
  },
  {
    id: "retirement",
    group: "Terminations",
    name: "Retirement",
    description: "Active employee retires; coverage may continue under retiree plan.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "04", ins05: "A", ins08: "RT",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=04 (Retirement). Employment status=RT."
  },
  {
    id: "non-payment-term",
    group: "Terminations",
    name: "Termination — Non-payment",
    description: "Coverage cancelled for non-payment of premiums.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "024", ins04: "59", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"}
    ],
    notes: "INS04=59 (Non-payment)."
  },

  // ----- CHANGES GROUP -----
  {
    id: "address-change",
    group: "Changes",
    name: "Address Change",
    description: "Member relocated; mailing address updated.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "43", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=43 (Change of Location)."
  },
  {
    id: "name-change",
    group: "Changes",
    name: "Name Change",
    description: "Member legal name changed (e.g. marriage).",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "25", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=25 (Change in Identifying Data Elements)."
  },
  {
    id: "plan-change",
    group: "Changes",
    name: "Plan / Coverage Change",
    description: "Subscriber switches between plans (e.g. PPO to HMO).",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "22", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=22 (Plan Change)."
  },
  {
    id: "coverage-tier-change",
    group: "Changes",
    name: "Coverage Tier Change",
    description: "Coverage level changed (e.g. Employee Only → Family).",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "EC", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    defaults: { coverageLevel: "FAM" },
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=EC (Member Benefit Selection)."
  },
  {
    id: "pcp-change",
    group: "Changes",
    name: "Primary Care Provider Change",
    description: "Member selects a new primary care physician.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "15", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=15 (Primary Care Provider Change)."
  },
  {
    id: "salary-change",
    group: "Changes",
    name: "Personnel/Salary Update",
    description: "HR personnel data update (salary, hours, etc.).",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "33", ins05: "A", ins08: "FT",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=33 (Personnel Data)."
  },

  // ----- COBRA / SPECIAL -----
  {
    id: "cobra-enrollment",
    group: "COBRA / Leave",
    name: "COBRA Enrollment",
    description: "Member elects COBRA continuation following termination.",
    bgn08: "00",
    ins01: "Y", ins02: "18", ins03: "021", ins04: "09", ins05: "C", ins08: "TE",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "INS05=C (COBRA), INS04=09 (COBRA)."
  },
  {
    id: "cobra-premium-paid",
    group: "COBRA / Leave",
    name: "COBRA Premium Payment",
    description: "Notification that COBRA premium was paid.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "10", ins05: "C", ins08: "TE",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=10 (COBRA Premium Paid)."
  },
  {
    id: "leave-with-benefits",
    group: "COBRA / Leave",
    name: "Leave of Absence (with Benefits)",
    description: "Member is on a paid/medical leave; benefits continue.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "37", ins05: "A", ins08: "AO",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=37 (Leave of Absence with Benefits)."
  },
  {
    id: "leave-without-benefits",
    group: "COBRA / Leave",
    name: "Leave of Absence (without Benefits)",
    description: "Member is on unpaid leave; benefits suspended.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "024", ins04: "38", ins05: "A", ins08: "AO",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "357", source: "effectiveDate"}
    ],
    notes: "INS04=38 (Leave of Absence without Benefits)."
  },
  {
    id: "disability",
    group: "COBRA / Leave",
    name: "Disability Status",
    description: "Member declared disabled — may extend benefit eligibility.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "21", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"},
      {qualifier: "386", source: "effectiveDate"}
    ],
    notes: "INS04=21 (Disability)."
  },
  {
    id: "surviving-spouse",
    group: "COBRA / Leave",
    name: "Surviving Spouse Coverage",
    description: "Coverage continued for spouse after subscriber death.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "001", ins04: "11", ins05: "S", ins08: "TE",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "303", source: "effectiveDate"}
    ],
    notes: "INS04=11 (Surviving Spouse), INS05=S (Surviving Insured)."
  },

  // ----- REINSTATEMENT / AUDIT -----
  {
    id: "reinstatement",
    group: "Reinstate / Audit",
    name: "Reinstatement",
    description: "Reinstate a previously terminated subscriber.",
    bgn08: "2",
    ins01: "Y", ins02: "18", ins03: "025", ins04: "AI", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "INS03=025 (Reinstatement)."
  },
  {
    id: "audit-compare",
    group: "Reinstate / Audit",
    name: "Audit / Compare",
    description: "Single-member audit verification record.",
    bgn08: "4",
    ins01: "Y", ins02: "18", ins03: "030", ins04: "AI", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "BGN08=4 (Verify), INS03=030 (Audit)."
  },
  {
    id: "full-file-replace",
    group: "Reinstate / Audit",
    name: "Full File Replacement",
    description: "Full-file replacement transaction containing multiple members.",
    bgn08: "RX",
    ins01: "Y", ins02: "18", ins03: "030", ins04: "AI", ins05: "A", ins08: "AC",
    includesSubscriber: true,
    extraMembers: 3,
    dateQualifiers: [
      {qualifier: "356", source: "effectiveDate"}
    ],
    notes: "BGN08=RX (Replace). Generates several randomized member records."
  }
];

window.SCENARIOS_BY_ID = window.SCENARIOS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});
